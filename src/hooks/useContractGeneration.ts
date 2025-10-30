import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContractClause {
  id: string;
  clause_name: string;
  clause_type: string;
  clause_content: string;
  legal_hint: string;
  customization_fields: any[];
  risk_level: string;
  is_mandatory: boolean;
  applicable_contract_types: string[];
}

export interface ContractTemplate {
  id: string;
  template_name: string;
  template_type: string;
  description: string;
  default_clauses: any;
  category: string;
  jurisdiction: string;
}

export interface GeneratedContract {
  id: string;
  contract_number: string;
  contract_type: string;
  party_a_name: string;
  party_b_name: string;
  generated_content: string;
  status: string;
  contract_value: number;
  currency: string;
  effective_date: string;
  created_at: string;
}

export const useContractGeneration = () => {
  const queryClient = useQueryClient();

  // Fetch templates
  const useTemplates = () => {
    return useQuery({
      queryKey: ['contract-templates'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('contract_templates')
          .select('*')
          .eq('is_active', true)
          .order('template_name');

        if (error) throw error;
        return data as ContractTemplate[];
      }
    });
  };

  // Fetch clauses
  const useClauses = (contractType?: string) => {
    return useQuery({
      queryKey: ['contract-clauses', contractType],
      queryFn: async () => {
        let query = supabase
          .from('contract_clauses')
          .select('*')
          .order('clause_name');

        if (contractType) {
          query = query.or(`applicable_contract_types.cs.{${contractType}},applicable_contract_types.cs.{all}`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as ContractClause[];
      }
    });
  };

  // Generate contract
  const generateContract = useMutation({
    mutationFn: async (params: {
      contractType: string;
      partyA: any;
      partyB: any;
      selectedClauses: string[];
      customizations: any;
      contractDetails: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Contract generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['generated-contracts'] });
    },
    onError: (error: any) => {
      toast.error('Failed to generate contract: ' + error.message);
    }
  });

  // Fetch generated contracts
  const useGeneratedContracts = (status?: string) => {
    return useQuery({
      queryKey: ['generated-contracts', status],
      queryFn: async () => {
        let query = supabase
          .from('generated_contracts')
          .select('*')
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as GeneratedContract[];
      }
    });
  };

  // Update contract status
  const updateContractStatus = useMutation({
    mutationFn: async ({ 
      contractId, 
      status 
    }: { 
      contractId: string; 
      status: string;
    }) => {
      const { data, error } = await supabase
        .from('generated_contracts')
        .update({ status })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Contract status updated');
      queryClient.invalidateQueries({ queryKey: ['generated-contracts'] });
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  return {
    useTemplates,
    useClauses,
    generateContract,
    useGeneratedContracts,
    updateContractStatus
  };
};
