-- Move Param Dave to the current firm
UPDATE team_members 
SET firm_id = '3fea2896-1608-4fe3-a421-a0d252658ed0'
WHERE id = 'dcd5f12c-5ab0-4603-bf79-71e891f5af98' 
  AND full_name = 'Param Dave';