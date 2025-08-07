# Print Job Monitoring System

## Overview

The ERP system now includes an automatic print job monitoring system that will notify you when jobs are overdue or completed. This addresses the need for automatic notifications when products finish printing.

## How It Works

### 1. Automatic Notifications

**Job Start Notifications:**
- When you mark a job as "Printing", the system automatically sends a notification
- Notification: "Print job for [Product Name] has started printing."

**Job Completion Notifications:**
- When you mark a job as "Completed", the system automatically sends a notification
- Notification: "Print job for [Product Name] has completed successfully!"

**Job Failure Notifications:**
- When you mark a job as "Failed", the system automatically sends a notification
- Notification: "Print job for [Product Name] has failed. Please check the printer."

### 2. Overdue Job Monitoring

**Automatic Monitoring:**
- The system checks every minute for jobs that should have finished
- If a job exceeds its estimated completion time by 5+ minutes, it sends an overdue notification
- Notification: "[Product Name] should have finished by now. Please check the printer."

**Manual Monitoring:**
- You can click "Check Overdue Jobs" button in the scheduler to manually check for overdue jobs
- This will immediately check all printing jobs and show notifications for any that are overdue

## Example Scenario

For your scenario with 2 products each needing 4 hours:

1. **Schedule the jobs** in the Production Scheduler
2. **Start printing** - Mark job status as "Printing"
   - System sends: "Print job for [Product Name] has started printing."
3. **Automatic monitoring** - Every minute, the system checks if jobs should be finished
4. **Overdue notification** - If a job runs longer than 4 hours + 5 minutes:
   - System sends: "[Product Name] should have finished by now. Please check the printer."
5. **Complete the job** - Mark job status as "Completed"
   - System sends: "Print job for [Product Name] has completed successfully!"

## Technical Implementation

### API Endpoints

- `PUT /api/print-jobs/[id]` - Updates job status and sends notifications
- `POST /api/print-jobs/monitor` - Checks for overdue jobs and sends notifications

### Database Fields Used

- `print_jobs.started_at` - When the job started printing
- `print_jobs.estimated_print_time` - Estimated duration in hours
- `print_jobs.status` - Current job status (Pending, Printing, Completed, Failed)

### Notification Types

- `started` - Job has started printing
- `completed` - Job has finished successfully
- `overdue` - Job should have finished by now
- `failed` - Job has failed

## Benefits

1. **No Manual Timer Needed** - The system automatically tracks job completion times
2. **Immediate Notifications** - Get notified as soon as jobs start, complete, or become overdue
3. **Background Monitoring** - Works even when you're not actively using the system
4. **Manual Override** - Can manually check for overdue jobs anytime
5. **Integration** - Works with existing notification system and dashboard

## Usage

1. **Schedule your jobs** as normal in the Production Scheduler
2. **Start printing** by changing job status to "Printing"
3. **Monitor notifications** in the notification center
4. **Check overdue jobs** manually if needed using the "Check Overdue Jobs" button
5. **Complete jobs** by changing status to "Completed"

The system will handle the rest automatically! 