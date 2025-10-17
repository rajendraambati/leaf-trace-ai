# Database Schema Documentation

## Overview

PostgreSQL database with Row-Level Security (RLS) enabled on all tables. Uses UUID primary keys and timestamp tracking.

## Tables

### farmers
```sql
id TEXT PRIMARY KEY (8 characters)
user_id UUID (links to auth.users)
name TEXT NOT NULL
phone TEXT
email TEXT
location TEXT NOT NULL
farm_size_acres NUMERIC
geo_latitude NUMERIC
geo_longitude NUMERIC
status TEXT DEFAULT 'active'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### procurement_batches
```sql
id TEXT PRIMARY KEY
farmer_id TEXT → farmers(id) (8 characters)
quantity_kg NUMERIC NOT NULL
grade TEXT NOT NULL
price_per_kg NUMERIC NOT NULL
total_price NUMERIC
qr_code TEXT
status TEXT DEFAULT 'pending'
created_by UUID
procurement_date TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

### shipments
```sql
id TEXT PRIMARY KEY
batch_id TEXT
from_location TEXT NOT NULL
to_location TEXT NOT NULL
vehicle_id TEXT
driver_name TEXT
status TEXT DEFAULT 'pending'
departure_time TIMESTAMP
eta TIMESTAMP
actual_arrival TIMESTAMP
gps_latitude NUMERIC
gps_longitude NUMERIC
temperature_min NUMERIC
temperature_max NUMERIC
created_at TIMESTAMP
updated_at TIMESTAMP
```

### ai_gradings
```sql
id UUID PRIMARY KEY
batch_id TEXT
image_url TEXT
ai_grade TEXT
confidence NUMERIC
quality_score NUMERIC
crop_health_score NUMERIC
esg_score NUMERIC
defects_detected TEXT[]
recommendations TEXT[]
analyzed_at TIMESTAMP
```

### user_feedback
```sql
id UUID PRIMARY KEY
user_id UUID → auth.users(id)
feature_type TEXT NOT NULL
resource_id TEXT
rating INTEGER (1-5)
feedback_text TEXT
category TEXT
status TEXT DEFAULT 'pending'
created_at TIMESTAMP
reviewed_at TIMESTAMP
reviewed_by UUID
```

### ai_usage_analytics
```sql
id UUID PRIMARY KEY
user_id UUID
feature_type TEXT NOT NULL
model_name TEXT
confidence_score NUMERIC
execution_time_ms INTEGER
success BOOLEAN
user_accepted BOOLEAN
user_modified BOOLEAN
created_at TIMESTAMP
```

## RLS Policies

All tables use role-based policies via `has_role()` function. See [SECURITY.md](./SECURITY.md) for details.
