-- Update cases to have the same firm_id as their associated clients
UPDATE cases 
SET firm_id = clients.firm_id
FROM clients 
WHERE cases.client_id = clients.id 
AND cases.firm_id IS NULL;