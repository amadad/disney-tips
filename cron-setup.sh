#!/bin/bash
# Setup midnight EST cron jobs for Disney Tips compound product
# All times in Eastern Standard Time (UTC-5)

# Get current crontab
crontab -l 2>/dev/null | grep -v "disney-tips" > /tmp/current-cron

# Add new cron jobs
cat >> /tmp/current-cron << 'EOF'
# Disney Tips - Midnight EST Compound Flow
# 12:00 AM EST (5:00 AM UTC) - Run pipeline
0 5 * * * cd /home/deploy/base/projects/disney-tips && source ~/.nvm/nvm.sh && npm run pipeline >> /home/deploy/base/logs/disney-tips.log 2>&1

# 12:15 AM EST (5:15 AM UTC) - Build
15 5 * * * cd /home/deploy/base/projects/disney-tips && source ~/.nvm/nvm.sh && npm run build >> /home/deploy/base/logs/disney-tips.log 2>&1

# 12:30 AM EST (5:30 AM UTC) - Generate report
30 5 * * * /home/deploy/.clawdbot/skills/report-gen/scripts/report-gen.sh --project /home/deploy/base/projects/disney-tips >> /home/deploy/base/logs/disney-tips.log 2>&1

# 12:45 AM EST (5:45 AM UTC) - Orchestrate (analyze + fix issues + create PRs)
45 5 * * * /home/deploy/.clawdbot/skills/orchestrator/scripts/orchestrator.sh --project /home/deploy/base/projects/disney-tips --autonomous >> /home/deploy/base/logs/disney-tips.log 2>&1

# 1:00 AM EST (6:00 AM UTC) - Email report to ali@scty.org
0 6 * * * /home/deploy/clawd/skills/email/send-daily-report.sh --project /home/deploy/base/projects/disney-tips >> /home/deploy/base/logs/disney-tips.log 2>&1
EOF

# Apply crontab
crontab /tmp/current-cron
echo "Crontab updated:"
crontab -l | grep disney-tips
