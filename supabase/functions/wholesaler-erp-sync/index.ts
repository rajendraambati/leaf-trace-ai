import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  sync_type: 'push' | 'pull' | 'bidirectional';
  entity_type: 'retailers' | 'orders' | 'campaigns' | 'all';
  entity_ids?: string[];
  erp_endpoint?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const payload: SyncRequest = await req.json();
    console.log('Wholesaler ERP sync request:', payload);

    const syncLogId = crypto.randomUUID();

    // Create sync log
    await supabase.from('wholesaler_erp_sync_logs').insert({
      id: syncLogId,
      sync_type: payload.sync_type,
      entity_type: payload.entity_type,
      entity_ids: payload.entity_ids || [],
      direction: payload.sync_type,
      status: 'in_progress',
      initiated_by: user.id,
      request_payload: payload
    });

    let syncedData: any = {};
    let recordsProcessed = 0;
    let recordsFailed = 0;

    try {
      // Pull data from wholesaler ERP
      if (payload.sync_type === 'pull' || payload.sync_type === 'bidirectional') {
        if (payload.entity_type === 'retailers' || payload.entity_type === 'all') {
          // Simulate ERP API call
          console.log('Pulling retailer data from ERP...');
          const erpRetailers = await simulateERPRetailersPull();
          
          for (const erpRetailer of erpRetailers) {
            try {
              const { error } = await supabase
                .from('retailers')
                .upsert({
                  retailer_code: erpRetailer.code,
                  business_name: erpRetailer.name,
                  contact_person: erpRetailer.contact,
                  email: erpRetailer.email,
                  phone: erpRetailer.phone,
                  address: erpRetailer.address,
                  city: erpRetailer.city,
                  state: erpRetailer.state,
                  onboarding_status: 'active'
                }, { onConflict: 'retailer_code' });

              if (!error) recordsProcessed++;
              else recordsFailed++;
            } catch (err) {
              recordsFailed++;
              console.error('Error syncing retailer:', err);
            }
          }
        }

        if (payload.entity_type === 'orders' || payload.entity_type === 'all') {
          console.log('Pulling order data from ERP...');
          const erpOrders = await simulateERPOrdersPull();
          
          for (const erpOrder of erpOrders) {
            try {
              const { error } = await supabase
                .from('retailer_orders')
                .upsert({
                  order_number: erpOrder.order_number,
                  retailer_id: erpOrder.retailer_id,
                  order_date: erpOrder.order_date,
                  total_quantity_kg: erpOrder.quantity,
                  total_amount: erpOrder.amount,
                  order_items: erpOrder.items,
                  order_status: erpOrder.status,
                  erp_order_id: erpOrder.erp_id,
                  erp_synced_at: new Date().toISOString()
                }, { onConflict: 'order_number' });

              if (!error) recordsProcessed++;
              else recordsFailed++;
            } catch (err) {
              recordsFailed++;
              console.error('Error syncing order:', err);
            }
          }
        }
      }

      // Push data to wholesaler ERP
      if (payload.sync_type === 'push' || payload.sync_type === 'bidirectional') {
        if (payload.entity_type === 'orders' || payload.entity_type === 'all') {
          console.log('Pushing order data to ERP...');
          
          let query = supabase
            .from('retailer_orders')
            .select('*')
            .is('erp_synced_at', null);

          if (payload.entity_ids && payload.entity_ids.length > 0) {
            query = query.in('id', payload.entity_ids);
          }

          const { data: unsyncedOrders } = await query;

          if (unsyncedOrders) {
            for (const order of unsyncedOrders) {
              try {
                // Simulate pushing to ERP
                const erpResponse = await simulateERPOrderPush(order);
                
                if (erpResponse.success) {
                  await supabase
                    .from('retailer_orders')
                    .update({
                      erp_order_id: erpResponse.erp_id,
                      erp_synced_at: new Date().toISOString()
                    })
                    .eq('id', order.id);
                  
                  recordsProcessed++;
                } else {
                  recordsFailed++;
                }
              } catch (err) {
                recordsFailed++;
                console.error('Error pushing order to ERP:', err);
              }
            }
          }
        }
      }

      syncedData = {
        retailers: recordsProcessed,
        orders: recordsProcessed,
        campaigns: 0
      };

      // Update sync log with success
      await supabase
        .from('wholesaler_erp_sync_logs')
        .update({
          status: 'completed',
          records_processed: recordsProcessed,
          records_failed: recordsFailed,
          response_payload: syncedData,
          sync_completed_at: new Date().toISOString()
        })
        .eq('id', syncLogId);

      console.log('Sync completed successfully');

      return new Response(
        JSON.stringify({
          success: true,
          sync_id: syncLogId,
          records_processed: recordsProcessed,
          records_failed: recordsFailed,
          synced_data: syncedData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (syncError) {
      console.error('Sync error:', syncError);
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';

      // Update sync log with error
      await supabase
        .from('wholesaler_erp_sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          records_processed: recordsProcessed,
          records_failed: recordsFailed,
          sync_completed_at: new Date().toISOString()
        })
        .eq('id', syncLogId);

      throw syncError;
    }

  } catch (error) {
    console.error('Error in wholesaler ERP sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Simulation functions (replace with actual ERP API calls)
async function simulateERPRetailersPull() {
  return [
    {
      code: 'RET-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: 'Sample Retailer Store',
      contact: 'John Doe',
      email: 'contact@retailer.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY'
    }
  ];
}

async function simulateERPOrdersPull() {
  return [
    {
      order_number: 'ORD-' + Date.now(),
      retailer_id: null,
      order_date: new Date().toISOString().split('T')[0],
      quantity: 100,
      amount: 5000,
      items: [{ product: 'Tobacco', quantity: 100, price: 50 }],
      status: 'pending',
      erp_id: 'ERP-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    }
  ];
}

async function simulateERPOrderPush(order: any) {
  return {
    success: true,
    erp_id: 'ERP-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  };
}
