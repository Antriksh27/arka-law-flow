-- Update all 'pending' case statuses to 'in_court'
UPDATE cases 
SET status = 'in_court' 
WHERE status = 'pending';