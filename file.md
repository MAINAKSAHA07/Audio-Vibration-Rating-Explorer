# �� AWS EC2 Deployment Guide
## Audio-Vibration Rating Explorer Backend

This comprehensive guide covers deploying the Audio-Vibration Rating Explorer backend to AWS EC2 t3.small instance.

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [AWS Account Preparation](#aws-account-preparation)
3. [Pre-Deployment Setup](#pre-deployment-setup)
4. [EC2 Instance Launch](#ec2-instance-launch)
5. [Application Deployment](#application-deployment)
6. [Backend Configuration](#backend-configuration)
7. [Web Server Configuration](#web-server-configuration)
8. [Monitoring Setup](#monitoring-setup)
9. [Performance Optimization](#performance-optimization)
10. [Testing & Validation](#testing--validation)
11. [Scaling Considerations](#scaling-considerations)
12. [Cost Breakdown](#cost-breakdown)
13. [Backup & Recovery](#backup--recovery)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 **Overview**

### **Instance Specifications:**
- **Type**: t3.small
- **vCPUs**: 2
- **RAM**: 2GB
- **Storage**: 20GB gp3 (expandable)
- **Network**: Up to 5 Gbps
- **Cost**: ~$15/month

### **Why EC2 over Lambda:**
- ✅ **No File Size Limits**: Handle 50MB+ audio files
- ✅ **No Time Limits**: Process for hours if needed
- ✅ **Memory Efficiency**: Persistent model loading
- ✅ **Cost Effective**: 90% cheaper than Lambda
- ✅ **Full Control**: Install any dependencies
- ✅ **MATLAB Support**: Can install MATLAB Engine

---

## 🏗️ **AWS Account Preparation**

### **Step 1: Create AWS Account**

#### **1.1 Sign Up for AWS**
```bash
# Go to AWS website
https://aws.amazon.com/

# Click "Create an AWS Account"
# Follow the registration process:
1. Enter email address
2. Choose account name
3. Choose account type (Personal or Business)
4. Enter contact information
5. Choose support plan (Basic is free)
6. Enter payment information
7. Verify phone number
8. Choose support plan
9. Complete registration
```

#### **1.2 Account Verification**
```bash
# After registration:
1. Check email for verification link
2. Verify phone number
3. Complete identity verification
4. Set up billing alerts
5. Enable MFA (Multi-Factor Authentication)
```

### **Step 2: Configure Billing and Budgets**

#### **2.1 Set Up Billing Alerts**
```bash
# In AWS Console:
1. Go to Billing Dashboard
2. Click "Billing Preferences"
3. Enable "Receive Billing Alerts"
4. Set up CloudWatch billing alarms:
   - $10 threshold
   - $25 threshold
   - $50 threshold
```

#### **2.2 Create Budget**
```bash
# Create monthly budget:
1. Go to AWS Budgets
2. Click "Create budget"
3. Choose "Cost budget"
4. Set budget amount: $30/month
5. Add alerts at 50%, 80%, 100%
6. Configure notifications
```

### **Step 3: Set Up IAM (Identity and Access Management)**

#### **3.1 Create IAM User**
```bash
# Create dedicated user for deployment:
1. Go to IAM Console
2. Click "Users" → "Create user"
3. Username: "audio-backend-admin"
4. Access type: "Programmatic access"
5. Attach policies:
   - AmazonEC2FullAccess
   - AmazonS3FullAccess
   - AmazonRoute53FullAccess
   - AWSCertificateManagerFullAccess
   - CloudWatchFullAccess
   - IAMReadOnlyAccess
```

#### **3.2 Create Access Keys**
```bash
# Generate access keys:
1. Select the user
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Choose "Application running outside AWS"
5. Download CSV file with keys
6. Store securely (never commit to git)
```

#### **3.3 Configure AWS CLI**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure with your credentials
aws configure
# Enter:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-2
# Default output format: json

# Test configuration
aws sts get-caller-identity
```

### **Step 4: Set Up Required AWS Services**

#### **4.1 S3 Bucket Setup**
```bash
# Create S3 bucket for audio files:
aws s3 mb s3://aduiovibrations --region us-east-2

# Configure bucket policy
aws s3api put-bucket-policy --bucket aduiovibrations --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::aduiovibrations/*"
    }
  ]
}'

# Enable CORS
aws s3api put-bucket-cors --bucket aduiovibrations --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
}'
```

#### **4.2 Route 53 Setup (Optional)**
```bash
# If you have a domain:
1. Go to Route 53 Console
2. Click "Hosted zones"
3. Click "Create hosted zone"
4. Enter domain name (e.g., yourdomain.com)
5. Choose "Public hosted zone"
6. Click "Create"
7. Note the 4 nameservers
8. Update your domain registrar with these nameservers
```

#### **4.3 Certificate Manager Setup**
```bash
# Request SSL certificate:
1. Go to Certificate Manager
2. Click "Request a certificate"
3. Choose "Request a public certificate"
4. Add domain names:
   - yourdomain.com
   - api.yourdomain.com
   - *.yourdomain.com (wildcard)
5. Choose DNS validation
6. Add CNAME records to Route 53
7. Wait for validation (can take up to 30 minutes)
```

### **Step 5: Security Configuration**

#### **5.1 Create Key Pair**
```bash
# Create EC2 key pair:
1. Go to EC2 Console
2. Click "Key Pairs" in left sidebar
3. Click "Create key pair"
4. Name: "audio-backend-key"
5. Key pair type: RSA
6. Private key file format: .pem
7. Click "Create key pair"
8. Download and store securely
9. Set proper permissions:
   chmod 400 audio-backend-key.pem
```

#### **5.2 Create Security Group**
```bash
# Create security group:
1. Go to EC2 Console
2. Click "Security Groups" in left sidebar
3. Click "Create security group"
4. Name: "audio-backend-sg"
5. Description: "Security group for audio backend"
6. VPC: Default VPC
7. Add inbound rules:
   - Type: SSH, Port: 22, Source: Your IP
   - Type: HTTP, Port: 80, Source: 0.0.0.0/0
   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0
8. Add outbound rules:
   - Type: All traffic, Port: All, Destination: 0.0.0.0/0
9. Click "Create security group"
```

### **Step 6: Set Up CloudWatch**

#### **6.1 Create Log Groups**
```bash
# Create CloudWatch log groups:
aws logs create-log-group --log-group-name /aws/ec2/audio-backend
aws logs create-log-group --log-group-name /aws/ec2/audio-backend/nginx

# Set retention policy
aws logs put-retention-policy --log-group-name /aws/ec2/audio-backend --retention-in-days 7
aws logs put-retention-policy --log-group-name /aws/ec2/audio-backend/nginx --retention-in-days 7
```

#### **6.2 Create CloudWatch Alarms**
```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "AWS-Billing-Alarm" \
  --alarm-description "Alert when AWS charges exceed $25" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 25 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### **Step 7: Environment Variables Setup**

#### **7.1 Create Environment File**
```bash
# Create .env file for local development
nano .env

# Add these variables:
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-2
AWS_BUCKET_NAME=aduiovibrations
DOMAIN_NAME=yourdomain.com
API_DOMAIN=api.yourdomain.com
```

#### **7.2 Set Up AWS Credentials for EC2**
```bash
# Create IAM role for EC2:
1. Go to IAM Console
2. Click "Roles" → "Create role"
3. Choose "AWS service" → "EC2"
4. Attach policies:
   - AmazonS3ReadOnlyAccess
   - CloudWatchLogsFullAccess
5. Role name: "AudioBackendEC2Role"
6. Attach this role to your EC2 instance
```

### **Step 8: Pre-Deployment Checklist**

#### **8.1 Verify All Services**
```bash
# Test AWS CLI access
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://aduiovibrations

# Test EC2 access
aws ec2 describe-instances

# Test Route 53 access (if using)
aws route53 list-hosted-zones

# Test Certificate Manager access
aws acm list-certificates
```

#### **8.2 Cost Estimation**
```bash
# Use AWS Pricing Calculator:
https://calculator.aws/

# Estimate monthly costs:
- EC2 t3.small: $15.00
- EBS 20GB: $2.00
- Data transfer: $1.00
- Route 53: $0.50
- Certificate Manager: Free
- CloudWatch: $1.00
Total: ~$19.50/month
```

### **Step 9: Security Best Practices**

#### **9.1 Enable MFA**
```bash
# Enable MFA for root account:
1. Go to IAM Console
2. Click "Users" → Select root user
3. Go to "Security credentials" tab
4. Click "Assign MFA device"
5. Choose "Virtual MFA device"
6. Scan QR code with authenticator app
7. Enter two consecutive codes
```

#### **9.2 Set Up CloudTrail**
```bash
# Enable CloudTrail for audit logging:
1. Go to CloudTrail Console
2. Click "Create trail"
3. Trail name: "audio-backend-trail"
4. Choose "Create new S3 bucket"
5. Enable "Log file validation"
6. Click "Create"
```

#### **9.3 Configure GuardDuty**
```bash
# Enable GuardDuty for threat detection:
1. Go to GuardDuty Console
2. Click "Enable GuardDuty"
3. Choose "30-day free trial"
4. Click "Enable GuardDuty"
```

### **Step 10: Backup and Recovery Setup**

#### **10.1 Create Backup S3 Bucket**
```bash
# Create backup bucket:
aws s3 mb s3://aduiovibrations-backup --region us-east-2

# Enable versioning
aws s3api put-bucket-versioning --bucket aduiovibrations-backup --versioning-configuration Status=Enabled

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration --bucket aduiovibrations-backup --lifecycle-configuration '{
  "Rules": [
    {
      "ID": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}'
```

#### **10.2 Set Up Cross-Region Replication**
```bash
# Create bucket in different region
aws s3 mb s3://aduiovibrations-backup-dr --region us-west-2

# Configure replication
aws s3api put-bucket-replication --bucket aduiovibrations --replication-configuration '{
  "Role": "arn:aws:iam::account:role/replication-role",
  "Rules": [
    {
      "ID": "ReplicateToDR",
      "Status": "Enabled",
      "Prefix": "",
      "Destination": {
        "Bucket": "arn:aws:s3:::aduiovibrations-backup-dr",
        "StorageClass": "STANDARD_IA"
      }
    }
  ]
}'
```

---

## 🔧 **Pre-Deployment Setup**

### **1. Domain Setup (Optional)**
```bash
# If you don't have a domain yet:
1. Purchase domain (e.g., yourdomain.com)
2. Set up Route 53 hosted zone
3. Update nameservers with domain registrar
```

### **2. Local Development Setup**
```bash
# Install required tools locally:
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform (optional, for infrastructure as code)
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Ansible (optional, for configuration management)
sudo apt update
sudo apt install ansible
```

### **3. Repository Preparation**
```bash
# Clone your repository
git clone https://github.com/MAINAKSAHA07/Audio-Vibration-Rating-Explorer.git
cd Audio-Vibration-Rating-Explorer

# Create deployment branch
git checkout -b deployment

# Add deployment files
git add deploy/
git add DEPLOYMENT_README.md
git commit -m "Add deployment configuration"
git push origin deployment
```

---

## 🖥️ **EC2 Instance Launch**

### **1. Launch Instance**
```bash
# Instance Configuration:
AMI: Ubuntu Server 22.04 LTS (64-bit x86)
Instance Type: t3.small
Key Pair: audio-backend-key
Security Group: audio-backend-sg
Storage: 20GB gp3 (expandable)
```

### **2. Connect to Instance**
```bash
# SSH connection
ssh -i audio-backend-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

---

## 📦 **Application Deployment**

### **1. Clone Repository**
```bash
# On EC2 instance
cd /opt
sudo git clone https://github.com/MAINAKSAHA07/Audio-Vibration-Rating-Explorer.git
sudo chown -R ubuntu:ubuntu Audio-Vibration-Rating-Explorer
cd Audio-Vibration-Rating-Explorer
```

### **2. Run Deployment Script**
```bash
# Make scripts executable
chmod +x deploy/*.sh

# Run the complete setup
sudo ./deploy/ec2-setup.sh
```

### **3. Verify Installation**
```bash
# Check Python environment
python3 --version  # Should be 3.11+
pip3 --version

# Check system dependencies
ffmpeg -version
nginx -v
```

---

## ⚙️ **Backend Configuration**

### **1. Environment Variables**
```bash
# Create environment file
sudo nano /opt/audio-vibration-backend/.env

# Add these variables:
FLASK_ENV=production
FLASK_APP=app.py
PYTHONPATH=/opt/audio-vibration-backend
AWS_BUCKET_NAME=aduiovibrations
AWS_REGION=us-east-2
```

### **2. Memory Optimization for t3.small**
```python
# Add to backend/app.py
import gc
import psutil
import resource

def optimize_memory():
    """Optimize memory usage for t3.small"""
    # Set memory limits
    resource.setrlimit(resource.RLIMIT_AS, (1.5 * 1024 * 1024 * 1024, -1))  # 1.5GB limit
    
    # Force garbage collection
    gc.collect()
    
    # Monitor memory usage
    memory = psutil.virtual_memory()
    if memory.percent > 80:
        print(f"⚠️ High memory usage: {memory.percent}%")
        gc.collect()

# Call before each algorithm
@app.before_request
def before_request():
    optimize_memory()
```

### **3. Model Loading Optimization**
```python
# Lazy loading for neural models
import threading

class ModelManager:
    def __init__(self):
        self._models = {}
        self._lock = threading.Lock()
    
    def get_model(self, model_name):
        if model_name not in self._models:
            with self._lock:
                if model_name not in self._models:
                    print(f"Loading {model_name}...")
                    if model_name == 'model1':
                        self._models[model_name] = Model1Inference(str(model1_path))
                    elif model_name == 'model2':
                        self._models[model_name] = Model2Inference(str(model2_path))
                    print(f"{model_name} loaded successfully")
        return self._models[model_name]

# Use singleton pattern
model_manager = ModelManager()
```

### **4. Algorithm Processing Optimization**
```python
# Process algorithms sequentially to save memory
def process_algorithms_sequential(file_path, algorithms):
    results = {}
    
    for algorithm in algorithms:
        try:
            print(f"Processing {algorithm}...")
            
            if algorithm == 'freqshift':
                result = freqshift_process(file_path)
            elif algorithm == 'hapticgen':
                result = hapticgen_process(file_path)
            elif algorithm == 'percept':
                result = percept_process(file_path)
            elif algorithm == 'model1':
                model = model_manager.get_model('model1')
                result = model.inference(file_path)
            elif algorithm == 'model2':
                model = model_manager.get_model('model2')
                result = model.inference(file_path)
            
            results[algorithm] = result
            
            # Force garbage collection after each algorithm
            gc.collect()
            
        except Exception as e:
            results[algorithm] = {'error': str(e)}
    
    return results
```

### **5. File Cleanup**
```python
# Add automatic cleanup
import time
import threading

def cleanup_old_files():
    """Clean up old files every hour"""
    while True:
        try:
            current_time = time.time()
            max_age = 3600  # 1 hour
            
            for file_path in Path(OUTPUT_FOLDER).glob('*'):
                if file_path.is_file():
                    file_age = current_time - file_path.stat().st_mtime
                    if file_age > max_age:
                        file_path.unlink()
                        print(f"Cleaned up old file: {file_path.name}")
            
            time.sleep(3600)  # Run every hour
        except Exception as e:
            print(f"Cleanup error: {e}")
            time.sleep(3600)

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
cleanup_thread.start()
```

---

## 🌐 **Web Server Configuration**

### **1. Nginx Configuration**
```bash
# Configure Nginx for your domain
sudo ./deploy/configure-nginx.sh api.yourdomain.com
```

### **2. SSL Certificate**
```bash
# Install SSL certificate
sudo ./deploy/setup-ssl.sh api.yourdomain.com
```

### **3. Start Services**
```bash
# Start the backend service
sudo ./deploy/start-services.sh
```

---

##  **Monitoring Setup**

### **1. System Monitoring Script**
```bash
# Create monitoring script
sudo nano /opt/audio-vibration-backend/monitor.sh
```

```bash
#!/bin/bash
# Monitoring script for t3.small

echo "=== Audio Backend Monitoring ==="
echo "Date: $(date)"
echo

# System resources
echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
echo

echo "Memory Usage:"
free -h
echo

echo "Disk Usage:"
df -h /opt/audio-vibration-backend
echo

# Service status
echo "=== Service Status ==="
sudo systemctl is-active audio-backend && echo "✅ Backend Running" || echo "❌ Backend Stopped"
sudo systemctl is-active nginx && echo "✅ Nginx Running" || echo "❌ Nginx Stopped"
echo

# Recent logs
echo "=== Recent Logs ==="
sudo journalctl -u audio-backend -n 5 --no-pager
echo

# Active connections
echo "=== Active Connections ==="
sudo netstat -tulpn | grep :8000 | wc -l | xargs echo "Backend connections:"
sudo netstat -tulpn | grep :80 | wc -l | xargs echo "HTTP connections:"
sudo netstat -tulpn | grep :443 | wc -l | xargs echo "HTTPS connections:"
```

### **2. Log Rotation**
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/audio-backend

# Add this configuration:
/opt/audio-vibration-backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        sudo systemctl reload audio-backend
    endscript
}
```

### **3. Key Metrics to Monitor**
```bash
# System metrics:
- CPU usage
- Memory usage
- Disk usage
- Network I/O

# Application metrics:
- Request count
- Response time
- Error rate
- Algorithm performance

# Business metrics:
- File processing time
- User satisfaction
- Cost per request
```

---

## 🧪 **Testing & Validation**

### **1. Health Check**
```bash
# Test backend health
curl https://api.yourdomain.com/health

# Expected response:
{
  "status": "healthy",
  "algorithms": ["freqshift", "hapticgen", "percept", "model1", "model2"],
  "message": "Audio-Vibration backend service is running"
}
```

### **2. Algorithm Testing**
```bash
# Test each algorithm with a sample file
curl -X POST https://api.yourdomain.com/generate-and-download \
  -F "audio_file=@test_audio.wav" \
  -F "algorithm=freqshift" \
  --output freqshift_output.wav

# Test all algorithms
curl -X POST https://api.yourdomain.com/generate-vibrations \
  -F "audio_file=@test_audio.wav"
```

### **3. Performance Testing**
```bash
# Test with different file sizes
# Small file (1MB)
# Medium file (10MB)
# Large file (50MB)

# Monitor memory usage during tests
./monitor.sh
```

---

## 📈 **Scaling Considerations**

### **1. When to Scale Up**
```bash
# Monitor these metrics:
- CPU usage > 80% consistently
- Memory usage > 90% consistently
- Response time > 30 seconds
- Queue length > 10 requests
```

### **2. Scaling Options**
```bash
# Vertical scaling (upgrade instance):
t3.small → t3.medium (4GB RAM) → t3.large (8GB RAM)

# Horizontal scaling (multiple instances):
- Load balancer
- Multiple EC2 instances
- Shared storage (EFS)
```

### **3. Auto-scaling Configuration**
```bash
# Create auto-scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name audio-backend-asg \
  --launch-template LaunchTemplateName=audio-backend-template \
  --min-size 1 \
  --max-size 3 \
  --desired-capacity 1 \
  --target-group-arns arn:aws:elasticloadbalancing:region:account:targetgroup/audio-backend-tg
```

---

## 💰 **Cost Breakdown**

### **Monthly Costs (t3.small)**
```
EC2 Instance (t3.small): $15.00
EBS Storage (20GB): $2.00
Data Transfer: $1.00
Route 53 (if using): $0.50
Total: ~$18.50/month
```
<code_block_to_apply_changes_from>
```
Lambda Cost (per 1000 requests):
- 10GB memory × 2 minutes × $0.0000166667 = $0.33 per request
- 1000 requests = $330/month

EC2 Cost:
- t3.medium (4GB RAM) = $30/month
- Can handle 1000+ requests easily
- 90% cost savings!
```

---

## 💾 **Backup & Recovery**

### **1. Automated Backups**
```bash
# Create backup script
sudo nano /opt/audio-vibration-backend/backup.sh
```

```bash
#!/bin/bash
# Backup script

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/audio-vibration-backend

# Backup configuration files
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/nginx /etc/systemd/system/audio-backend.service

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### **2. Recovery Plan**
```bash
# Recovery steps:
1. Launch new EC2 instance
2. Restore from backup
3. Update DNS records
4. Test functionality
5. Switch traffic
```

### **3. Disaster Recovery**
```bash
# Multi-region backup
aws s3 sync /opt/audio-vibration-backend s3://your-backup-bucket/audio-backend/

# Cross-region replication
aws s3api put-bucket-replication \
  --bucket your-backup-bucket \
  --replication-configuration file://replication.json
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Memory Issues**
```bash
# Symptoms: Out of memory errors, slow performance
# Solution:
sudo systemctl restart audio-backend
./monitor.sh  # Check memory usage
```

#### **2. Service Won't Start**
```bash
# Check logs
sudo journalctl -u audio-backend -f

# Check configuration
sudo nginx -t
sudo systemctl status audio-backend
```

#### **3. SSL Certificate Issues**
```bash
# Renew certificate
sudo certbot renew --dry-run
sudo certbot renew
sudo systemctl reload nginx
```

#### **4. File Upload Issues**
```bash
# Check file permissions
ls -la /opt/audio-vibration-backend/uploads/
ls -la /opt/audio-vibration-backend/outputs/

# Check disk space
df -h
```

### **Debug Commands**
```bash
# Check service status
sudo systemctl status audio-backend nginx

# View logs
sudo journalctl -u audio-backend -n 50
sudo tail -f /var/log/nginx/error.log

# Test connectivity
curl -I https://api.yourdomain.com/health
telnet api.yourdomain.com 443

# Check processes
ps aux | grep python
ps aux | grep nginx
```

---

## 📅 **Deployment Timeline**

### **Day 1: Setup**
- Launch EC2 instance
- Configure security groups
- Install system dependencies

### **Day 2: Application**
- Deploy application code
- Configure environment
- Test basic functionality

### **Day 3: Web Server**
- Configure Nginx
- Set up SSL certificates
- Test web access

### **Day 4: Optimization**
- Implement memory optimizations
- Set up monitoring
- Performance testing

### **Day 5: Production**
- Final testing
- Go live
- Monitor performance

---

## 🔗 **Useful Commands**

### **Service Management**
```bash
# Start/stop/restart services
sudo systemctl start audio-backend
sudo systemctl stop audio-backend
sudo systemctl restart audio-backend
sudo systemctl status audio-backend

# Enable/disable services
sudo systemctl enable audio-backend
sudo systemctl disable audio-backend
```

### **Log Management**
```bash
# View logs
sudo journalctl -u audio-backend -f
sudo tail -f /opt/audio-vibration-backend/logs/app.log

# Clear logs
sudo journalctl --vacuum-time=7d
```

### **System Monitoring**
```bash
# Resource usage
htop
iotop
nethogs

# Disk usage
df -h
du -sh /opt/audio-vibration-backend/*

# Network connections
sudo netstat -tulpn | grep :8000
sudo ss -tulpn | grep :8000
```

---

## 📞 **Support & Maintenance**

### **Regular Maintenance Tasks**
```bash
# Weekly:
- Check disk space
- Review logs for errors
- Update system packages
- Backup configuration

# Monthly:
- Review performance metrics
- Update application dependencies
- Test disaster recovery
- Review costs
```

### **Emergency Contacts**
```bash
# AWS Support
- Basic: Included
- Developer: $29/month
- Business: $100/month
- Enterprise: $15,000/month
```

---

## 🎯 **Success Metrics**

### **Performance Targets**
- **Response Time**: < 30 seconds for 50MB files
- **Uptime**: > 99.5%
- **Memory Usage**: < 80% of 2GB
- **CPU Usage**: < 70% average

### **Business Metrics**
- **Cost per Request**: < $0.01
- **User Satisfaction**: > 4.5/5
- **Processing Success Rate**: > 95%

---

**🎉 Congratulations! Your Audio-Vibration Rating Explorer backend is now deployed on AWS EC2 with production-ready monitoring, optimization, and scaling capabilities.**

---

*Last Updated: $(date)*
*Version: 1.0*
*Author: Audio-Vibration Team*
```

I've created a comprehensive deployment README file that covers everything we discussed. This file includes:

## 📋 **What's Included:**

1. **Complete Setup Guide** - Step-by-step instructions
2. **Memory Optimization** - Specific code for t3.small constraints
3. **Monitoring Scripts** - Ready-to-use monitoring tools
4. **Troubleshooting Guide** - Common issues and solutions
5. **Cost Analysis** - Detailed cost breakdown and optimization
6. **Scaling Strategy** - When and how to scale up
7. **Backup & Recovery** - Disaster recovery procedures
8. **Timeline** - 5-day deployment schedule

## 🎯 **Key Features:**

- ✅ **Production-Ready**: All optimizations for t3.small
- ✅ **Memory Management**: Specific code for 2GB RAM limit
- ✅ **Monitoring**: Complete monitoring dashboard
- ✅ **Cost Effective**: 90% savings over Lambda
- ✅ **Scalable**: Clear scaling path
- ✅ **Maintainable**: Regular maintenance tasks

The file is saved as `DEPLOYMENT_README.md` in your project root, so you can access it anytime for reference. You can also use it as a checklist during deployment to ensure you don't miss any steps.

Would you like me to modify any section or add additional information to the README?

### **Cost Optimization Tips**
```bash
# 1. Use Spot Instances for batch processing
# 2. Implement auto-shutdown during low usage
# 3. Use S3 for long-term storage
# 4. Monitor and optimize resource usage
```

### **Cost Comparison with Lambda**
```

```