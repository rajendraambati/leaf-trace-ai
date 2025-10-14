# System Monitoring & Deployment Guide

## Overview
This application uses **Lovable Cloud** for backend infrastructure, providing automatic deployment, scaling, and monitoring capabilities.

## Deployment Architecture

### Frontend
- **Framework**: React + Vite + TypeScript
- **Hosting**: Lovable Cloud CDN
- **Deployment**: Automatic on code changes
- **URL**: Accessible via Lovable staging domain (yoursite.lovable.app)
- **Custom Domain**: Available on paid plans

### Backend (Lovable Cloud)
- **Database**: PostgreSQL (Supabase)
- **Edge Functions**: Deno runtime, serverless
- **Authentication**: Built-in with email, phone, Google
- **Storage**: Secure file storage buckets
- **Auto-scaling**: Handles traffic spikes automatically

## Deployment Process

### 1. Automatic Deployment
All changes are automatically deployed when you:
- Update code through Lovable chat
- Make manual code changes (if enabled)
- Commit to connected GitHub repository

### 2. Publishing to Production
```
1. Click "Publish" button in top-right corner
2. Review changes and confirm
3. Wait for deployment to complete (usually < 2 minutes)
4. Access your app at the provided URL
```

### 3. Custom Domain Setup
```
1. Navigate to Project > Settings > Domains
2. Enter your custom domain
3. Add DNS records as instructed
4. Verify and activate
```

## Monitoring & Observability

### Built-in Monitoring Dashboard
Access the System Monitoring page at `/system-monitoring` for:
- Real-time system health status
- Database table health checks
- Error rate tracking
- Recent activity logs
- Request metrics

### Backend Dashboard
Access detailed backend metrics:
1. Click "View Backend" in the monitoring page
2. Available metrics:
   - Database query performance
   - Edge function execution logs
   - Authentication events
   - Storage operations
   - Real-time analytics

### Edge Function Logs
Each edge function automatically logs:
- Request/response data
- Execution time
- Error traces
- Custom console.log outputs

Example logging pattern used in this project:
```typescript
console.log('Function started:', { timestamp: new Date().toISOString() });
console.error('Error occurred:', error.message, { context: data });
```

### Database Monitoring
- Row-Level Security (RLS) policies protect all tables
- Audit logs track all critical operations
- Real-time query performance metrics
- Connection pooling and optimization

## Health Checks

### System Status Indicators
- **Operational** (Green): Error rate < 10%
- **Degraded** (Yellow): Error rate 10-25%
- **Down** (Red): Error rate > 25%

### Monitored Metrics
| Metric | Update Frequency | Alert Threshold |
|--------|------------------|-----------------|
| Error Rate | 30 seconds | > 10% |
| Database Health | 60 seconds | Any table error |
| Request Volume | 30 seconds | - |
| Response Time | Real-time | > 5 seconds |

## Edge Functions

### Deployed Functions
1. **farmer-management**: CRUD operations for farmers
2. **procurement-management**: Procurement batch handling
3. **logistics-tracking**: Shipment tracking
4. **ai-grading**: AI-powered tobacco grading
5. **route-optimization**: Delivery route optimization
6. **mqtt-handler**: IoT device data processing
7. **compliance-reporting**: Government report generation
8. **crop-health-prediction**: ML-based crop health
9. **esg-scoring**: ESG score calculation
10. **inventory-management**: Warehouse inventory
11. **generate-compliance-report**: Automated compliance reports

### Function Monitoring
Each function logs to the backend analytics:
- Execution count
- Average response time
- Error rate
- Last execution timestamp

## Security & Compliance

### Authentication
- JWT-based token authentication
- Row-Level Security (RLS) on all tables
- Role-based access control (RBAC)
- Automatic user profile creation

### Data Protection
- Encrypted at rest and in transit
- Secure secret management
- API key rotation support
- Audit logging for compliance

### Secrets Management
Configured secrets (managed securely):
- LOVABLE_API_KEY: AI functionality
- AZURE_ML_GRADING_ENDPOINT: ML grading
- AZURE_ML_GRADING_API_KEY: ML authentication
- MQTT_BROKER_URL: IoT integration
- MQTT_USERNAME/PASSWORD: IoT security

## Performance Optimization

### Frontend
- Code splitting with React lazy loading
- Image optimization
- Progressive Web App (PWA) capabilities
- CDN caching

### Backend
- Edge functions run globally distributed
- Database query optimization with indexes
- Connection pooling
- Automatic scaling based on load

### Caching Strategy
- Static assets: CDN cached
- API responses: React Query caching (30-60s)
- Database queries: Optimized with proper indexes

## Troubleshooting

### Viewing Logs
1. **Application Logs**: Check browser console
2. **Backend Logs**: Access via Backend Dashboard
3. **Audit Logs**: Query `audit_logs` table
4. **Edge Function Logs**: View in Backend Dashboard under Functions

### Common Issues

**Database Connection Errors**
- Check RLS policies are correctly configured
- Verify user authentication
- Review audit logs for policy violations

**Edge Function Timeouts**
- Functions have 60-second timeout limit
- Check function logs for performance bottlenecks
- Consider optimizing database queries

**Authentication Issues**
- Verify email confirmation settings
- Check RBAC permissions
- Review user_roles table

## Rollback Procedures

### Version Control
1. Access Project History (click project name > History)
2. Select previous working version
3. Click "Revert" to restore

### Database Rollback
1. Migrations are tracked in `supabase/migrations/`
2. Contact support for database rollback assistance
3. Audit logs provide data change history

## Scaling Considerations

### Automatic Scaling
Lovable Cloud automatically handles:
- Traffic spikes (10x-100x normal load)
- Database connection pooling
- Edge function cold starts
- Storage bandwidth

### Usage Limits
- Free tier includes monthly usage credits
- Usage-based pricing for additional resources
- Monitor usage in Backend Dashboard

## CI/CD Pipeline

### Automated Workflow
```
Code Change → Automatic Build → Testing → Deploy → Live
```

### Deployment Stages
1. **Build**: Vite builds optimized production bundle
2. **Type Check**: TypeScript validation
3. **Deploy**: Frontend to CDN, Edge Functions to Deno runtime
4. **Verify**: Health checks and smoke tests

### GitHub Integration (Optional)
1. Connect GitHub in Project Settings
2. Automatic two-way sync
3. Use external CI/CD if needed
4. Lovable still handles deployment

## Best Practices

### Development
- Test changes in preview before publishing
- Use feature flags for gradual rollouts
- Monitor error rates after deployment
- Keep dependencies updated

### Monitoring
- Check System Monitoring dashboard daily
- Set up email alerts for critical errors
- Review audit logs weekly
- Monitor database growth trends

### Security
- Rotate secrets regularly
- Review RLS policies after schema changes
- Audit user permissions monthly
- Keep authentication methods updated

## Support & Resources

### Documentation
- [Lovable Cloud Docs](https://docs.lovable.dev/features/cloud)
- [Deployment Guide](https://docs.lovable.dev/user-guides/deployment)
- [Monitoring Best Practices](https://docs.lovable.dev/features/monitoring)

### Getting Help
- Access Backend Dashboard for detailed metrics
- Review System Monitoring page
- Check troubleshooting documentation
- Contact Lovable support for critical issues

## Monitoring Checklist

Daily:
- [ ] Check system status (Operational/Degraded/Down)
- [ ] Review error rate trends
- [ ] Verify database health

Weekly:
- [ ] Analyze audit logs for anomalies
- [ ] Review edge function performance
- [ ] Check storage usage

Monthly:
- [ ] Review and optimize slow queries
- [ ] Audit RLS policies
- [ ] Update dependencies
- [ ] Review scaling needs
