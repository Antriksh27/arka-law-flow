-- Create notification preferences table with comprehensive settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  firm_id UUID REFERENCES law_firms(id),
  
  -- Global Settings
  enabled BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Delivery Channels
  delivery_preferences JSONB DEFAULT '{
    "in_app": true,
    "email": true,
    "browser": true,
    "sound": true
  }'::jsonb,
  
  -- Category-specific settings (12 categories)
  categories JSONB DEFAULT '{
    "case": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
    "hearing": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
    "appointment": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
    "task": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
    "document": {"enabled": true, "frequency": "digest", "priority_filter": "high"},
    "invoice": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
    "message": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
    "client": {"enabled": true, "frequency": "digest", "priority_filter": "normal"},
    "team": {"enabled": true, "frequency": "digest", "priority_filter": "normal"},
    "system": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
    "ecourts": {"enabled": true, "frequency": "instant", "priority_filter": "high"},
    "legal_news": {"enabled": true, "frequency": "digest", "priority_filter": "high"}
  }'::jsonb,
  
  -- Event-specific overrides (87 events)
  event_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Digest settings
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('never', 'hourly', 'daily', 'weekly')),
  digest_time TIME DEFAULT '09:00',
  
  -- Muted entities
  muted_cases UUID[] DEFAULT '{}',
  muted_clients UUID[] DEFAULT '{}',
  muted_users UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification history table for archiving
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY,
  recipient_id UUID,
  notification_type TEXT,
  category TEXT,
  title TEXT,
  message TEXT,
  priority TEXT,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to existing notifications table
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS delivery_status TEXT CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'bounced')) DEFAULT 'delivered',
  ADD COLUMN IF NOT EXISTS delivery_channel TEXT[] DEFAULT '{in_app}',
  ADD COLUMN IF NOT EXISTS grouped_with UUID REFERENCES notifications(id),
  ADD COLUMN IF NOT EXISTS digest_batch_id UUID,
  ADD COLUMN IF NOT EXISTS dismissed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_firm ON notification_preferences(firm_id);
CREATE INDEX IF NOT EXISTS idx_notif_history_recipient ON notification_history(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notif_history_archived ON notification_history(archived_at);
CREATE INDEX IF NOT EXISTS idx_notif_dismissed ON notifications(dismissed) WHERE dismissed = false;
CREATE INDEX IF NOT EXISTS idx_notif_snoozed ON notifications(snoozed_until) WHERE snoozed_until IS NOT NULL;

-- Update trigger for notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_preferences_updated_at();

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences"
ON notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
ON notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
ON notification_preferences FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for notification_history
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification history"
ON notification_history FOR SELECT
USING (recipient_id = auth.uid());

-- Function to initialize notification preferences with role-based defaults
CREATE OR REPLACE FUNCTION initialize_notification_preferences(p_user_id UUID, p_role TEXT)
RETURNS VOID AS $$
DECLARE
  v_firm_id UUID;
  v_categories JSONB;
BEGIN
  -- Get user's firm_id
  SELECT firm_id INTO v_firm_id
  FROM team_members
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Set role-based defaults
  CASE p_role
    WHEN 'admin' THEN
      v_categories := '{
        "case": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "hearing": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "appointment": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "task": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "document": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "invoice": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "message": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "client": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "team": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "system": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "ecourts": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "legal_news": {"enabled": true, "frequency": "digest", "priority_filter": "high"}
      }'::jsonb;
    
    WHEN 'lawyer' THEN
      v_categories := '{
        "case": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "hearing": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "appointment": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "task": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "document": {"enabled": true, "frequency": "digest", "priority_filter": "high"},
        "invoice": {"enabled": true, "frequency": "digest", "priority_filter": "normal"},
        "message": {"enabled": true, "frequency": "instant", "priority_filter": "high"},
        "client": {"enabled": true, "frequency": "digest", "priority_filter": "normal"},
        "team": {"enabled": true, "frequency": "digest", "priority_filter": "normal"},
        "system": {"enabled": true, "frequency": "instant", "priority_filter": "high"},
        "ecourts": {"enabled": true, "frequency": "instant", "priority_filter": "high"},
        "legal_news": {"enabled": true, "frequency": "digest", "priority_filter": "high"}
      }'::jsonb;
    
    WHEN 'paralegal' THEN
      v_categories := '{
        "case": {"enabled": true, "frequency": "instant", "priority_filter": "high"},
        "hearing": {"enabled": true, "frequency": "digest", "priority_filter": "high"},
        "appointment": {"enabled": true, "frequency": "digest", "priority_filter": "normal"},
        "task": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "document": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "invoice": {"enabled": false, "frequency": "digest", "priority_filter": "normal"},
        "message": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "client": {"enabled": true, "frequency": "digest", "priority_filter": "normal"},
        "team": {"enabled": false, "frequency": "digest", "priority_filter": "normal"},
        "system": {"enabled": true, "frequency": "digest", "priority_filter": "high"},
        "ecourts": {"enabled": true, "frequency": "instant", "priority_filter": "high"},
        "legal_news": {"enabled": false, "frequency": "digest", "priority_filter": "high"}
      }'::jsonb;
    
    WHEN 'office_staff' THEN
      v_categories := '{
        "case": {"enabled": true, "frequency": "digest", "priority_filter": "high"},
        "hearing": {"enabled": true, "frequency": "digest", "priority_filter": "high"},
        "appointment": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "task": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "document": {"enabled": true, "frequency": "digest", "priority_filter": "normal"},
        "invoice": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "message": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "client": {"enabled": true, "frequency": "instant", "priority_filter": "normal"},
        "team": {"enabled": false, "frequency": "digest", "priority_filter": "normal"},
        "system": {"enabled": true, "frequency": "digest", "priority_filter": "high"},
        "ecourts": {"enabled": false, "frequency": "digest", "priority_filter": "high"},
        "legal_news": {"enabled": false, "frequency": "digest", "priority_filter": "high"}
      }'::jsonb;
    
    ELSE -- Default for client and other roles
      v_categories := '{
        "case": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "hearing": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "appointment": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "task": {"enabled": false, "frequency": "instant", "priority_filter": "all"},
        "document": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "invoice": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "message": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "client": {"enabled": false, "frequency": "digest", "priority_filter": "normal"},
        "team": {"enabled": false, "frequency": "digest", "priority_filter": "normal"},
        "system": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "ecourts": {"enabled": true, "frequency": "instant", "priority_filter": "all"},
        "legal_news": {"enabled": false, "frequency": "digest", "priority_filter": "high"}
      }'::jsonb;
  END CASE;
  
  -- Insert preferences if not exists
  INSERT INTO notification_preferences (user_id, firm_id, categories)
  VALUES (p_user_id, v_firm_id, v_categories)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;