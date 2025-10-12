-- Create function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_statistics(p_firm_id uuid, p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_count integer;
  read_count integer;
  unread_count integer;
  delivery_rate numeric;
  category_stats jsonb;
  priority_stats jsonb;
  daily_stats jsonb;
BEGIN
  -- Get total notification count
  SELECT COUNT(*) INTO total_count
  FROM notifications n
  JOIN team_members tm ON tm.user_id = n.recipient_id
  WHERE tm.firm_id = p_firm_id
    AND n.created_at >= NOW() - (p_days || ' days')::interval;
  
  -- Get read count
  SELECT COUNT(*) INTO read_count
  FROM notifications n
  JOIN team_members tm ON tm.user_id = n.recipient_id
  WHERE tm.firm_id = p_firm_id
    AND n.read = true
    AND n.created_at >= NOW() - (p_days || ' days')::interval;
  
  -- Get unread count
  unread_count := total_count - read_count;
  
  -- Calculate delivery rate (read notifications as delivered)
  delivery_rate := CASE 
    WHEN total_count > 0 THEN ROUND((read_count::numeric / total_count::numeric) * 100, 2)
    ELSE 0
  END;
  
  -- Get category statistics
  SELECT jsonb_object_agg(category, count)
  INTO category_stats
  FROM (
    SELECT n.category, COUNT(*) as count
    FROM notifications n
    JOIN team_members tm ON tm.user_id = n.recipient_id
    WHERE tm.firm_id = p_firm_id
      AND n.created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY n.category
  ) cat_counts;
  
  -- Get priority statistics
  SELECT jsonb_object_agg(priority, count)
  INTO priority_stats
  FROM (
    SELECT n.priority, COUNT(*) as count
    FROM notifications n
    JOIN team_members tm ON tm.user_id = n.recipient_id
    WHERE tm.firm_id = p_firm_id
      AND n.created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY n.priority
  ) pri_counts;
  
  -- Get daily statistics
  SELECT jsonb_agg(daily_data ORDER BY date DESC)
  INTO daily_stats
  FROM (
    SELECT 
      DATE(n.created_at) as date,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE n.read = true) as read,
      COUNT(*) FILTER (WHERE n.read = false) as unread
    FROM notifications n
    JOIN team_members tm ON tm.user_id = n.recipient_id
    WHERE tm.firm_id = p_firm_id
      AND n.created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY DATE(n.created_at)
  ) daily_data;
  
  -- Build result object
  result := jsonb_build_object(
    'total_notifications', total_count,
    'read_notifications', read_count,
    'unread_notifications', unread_count,
    'delivery_rate', delivery_rate,
    'category_breakdown', COALESCE(category_stats, '{}'::jsonb),
    'priority_breakdown', COALESCE(priority_stats, '{}'::jsonb),
    'daily_statistics', COALESCE(daily_stats, '[]'::jsonb),
    'period_days', p_days,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$;

-- Create function to get top notification recipients
CREATE OR REPLACE FUNCTION get_top_notification_recipients(p_firm_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  total_received integer,
  unread_count integer,
  read_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.recipient_id,
    p.full_name,
    COUNT(*)::integer as total_received,
    COUNT(*) FILTER (WHERE n.read = false)::integer as unread_count,
    ROUND((COUNT(*) FILTER (WHERE n.read = true)::numeric / COUNT(*)::numeric) * 100, 2) as read_rate
  FROM notifications n
  JOIN team_members tm ON tm.user_id = n.recipient_id
  JOIN profiles p ON p.id = n.recipient_id
  WHERE tm.firm_id = p_firm_id
    AND n.created_at >= NOW() - interval '30 days'
  GROUP BY n.recipient_id, p.full_name
  ORDER BY total_received DESC
  LIMIT p_limit;
END;
$$;

-- Create function to get recent notification activity
CREATE OR REPLACE FUNCTION get_recent_notification_activity(p_firm_id uuid, p_limit integer DEFAULT 20)
RETURNS TABLE(
  id uuid,
  title text,
  message text,
  category text,
  priority text,
  recipient_name text,
  created_at timestamp with time zone,
  read boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.category,
    n.priority,
    p.full_name as recipient_name,
    n.created_at,
    n.read
  FROM notifications n
  JOIN team_members tm ON tm.user_id = n.recipient_id
  JOIN profiles p ON p.id = n.recipient_id
  WHERE tm.firm_id = p_firm_id
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$;