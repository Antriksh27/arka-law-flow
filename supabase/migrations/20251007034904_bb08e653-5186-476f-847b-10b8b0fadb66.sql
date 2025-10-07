-- Update the upsert function to handle document and order links
CREATE OR REPLACE FUNCTION public.upsert_legalkart_case_data(
  p_cnr_number text,
  p_firm_id uuid,
  p_case_id uuid DEFAULT NULL,
  p_case_data jsonb DEFAULT NULL,
  p_documents jsonb DEFAULT NULL,
  p_objections jsonb DEFAULT NULL,
  p_orders jsonb DEFAULT NULL,
  p_history jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_legalkart_case_id uuid;
  doc_item jsonb;
  obj_item jsonb;
  order_item jsonb;
  hist_item jsonb;
BEGIN
  -- Upsert the main case record
  INSERT INTO public.legalkart_cases (
    cnr_number, firm_id, case_id, 
    filing_date, filing_number, registration_date, registration_number,
    coram, state, district, bench_type, stage_of_case, judicial_branch,
    next_hearing_date, before_me_part_heard, category, sub_category,
    petitioner_and_advocate, respondent_and_advocate, raw_api_response
  ) VALUES (
    p_cnr_number, p_firm_id, p_case_id,
    (p_case_data->>'filing_date')::date,
    p_case_data->>'filing_number',
    (p_case_data->>'registration_date')::date,
    p_case_data->>'registration_number',
    p_case_data->>'coram',
    p_case_data->>'state',
    p_case_data->>'district',
    p_case_data->>'bench_type',
    p_case_data->>'stage_of_case',
    p_case_data->>'judicial_branch',
    (p_case_data->>'next_hearing_date')::date,
    p_case_data->>'before_me_part_heard',
    p_case_data->>'category',
    p_case_data->>'sub_category',
    p_case_data->>'petitioner_and_advocate',
    p_case_data->>'respondent_and_advocate',
    p_case_data
  )
  ON CONFLICT (cnr_number) 
  DO UPDATE SET
    firm_id = EXCLUDED.firm_id,
    case_id = EXCLUDED.case_id,
    filing_date = EXCLUDED.filing_date,
    filing_number = EXCLUDED.filing_number,
    registration_date = EXCLUDED.registration_date,
    registration_number = EXCLUDED.registration_number,
    coram = EXCLUDED.coram,
    state = EXCLUDED.state,
    district = EXCLUDED.district,
    bench_type = EXCLUDED.bench_type,
    stage_of_case = EXCLUDED.stage_of_case,
    judicial_branch = EXCLUDED.judicial_branch,
    next_hearing_date = EXCLUDED.next_hearing_date,
    before_me_part_heard = EXCLUDED.before_me_part_heard,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    petitioner_and_advocate = EXCLUDED.petitioner_and_advocate,
    respondent_and_advocate = EXCLUDED.respondent_and_advocate,
    raw_api_response = EXCLUDED.raw_api_response,
    updated_at = now()
  RETURNING id INTO v_legalkart_case_id;

  -- Clear old related records
  DELETE FROM public.legalkart_case_documents WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_objections WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_orders WHERE legalkart_case_id = v_legalkart_case_id;
  DELETE FROM public.legalkart_case_history WHERE legalkart_case_id = v_legalkart_case_id;

  -- Insert documents if provided (now includes link fields)
  IF p_documents IS NOT NULL THEN
    FOR doc_item IN SELECT * FROM jsonb_array_elements(p_documents)
    LOOP
      INSERT INTO public.legalkart_case_documents (
        legalkart_case_id, sr_no, advocate, filed_by, document_no, document_filed, date_of_receiving,
        document_link, pdf_base64
      ) VALUES (
        v_legalkart_case_id,
        doc_item->>'sr_no',
        doc_item->>'advocate',
        doc_item->>'filed_by',
        doc_item->>'document_no',
        doc_item->>'document_filed',
        (doc_item->>'date_of_receiving')::date,
        doc_item->>'document_link',
        doc_item->>'pdf_base64'
      );
    END LOOP;
  END IF;

  -- Insert objections if provided
  IF p_objections IS NOT NULL THEN
    FOR obj_item IN SELECT * FROM jsonb_array_elements(p_objections)
    LOOP
      INSERT INTO public.legalkart_case_objections (
        legalkart_case_id, sr_no, objection, receipt_date, scrutiny_date, objection_compliance_date
      ) VALUES (
        v_legalkart_case_id,
        obj_item->>'sr_no',
        obj_item->>'objection',
        (obj_item->>'receipt_date')::date,
        (obj_item->>'scrutiny_date')::date,
        (obj_item->>'objection_compliance_date')::date
      );
    END LOOP;
  END IF;

  -- Insert orders if provided (now includes link fields)
  IF p_orders IS NOT NULL THEN
    FOR order_item IN SELECT * FROM jsonb_array_elements(p_orders)
    LOOP
      INSERT INTO public.legalkart_case_orders (
        legalkart_case_id, judge, hearing_date, order_number, bench, order_details,
        order_link, pdf_base64
      ) VALUES (
        v_legalkart_case_id,
        order_item->>'judge',
        (order_item->>'hearing_date')::date,
        order_item->>'order_number',
        order_item->>'bench',
        order_item->>'order_details',
        order_item->>'order_link',
        order_item->>'pdf_base64'
      );
    END LOOP;
  END IF;

  -- Insert history if provided
  IF p_history IS NOT NULL THEN
    FOR hist_item IN SELECT * FROM jsonb_array_elements(p_history)
    LOOP
      INSERT INTO public.legalkart_case_history (
        legalkart_case_id, hearing_date, judge, purpose_of_hearing, business_on_date, cause_list_type
      ) VALUES (
        v_legalkart_case_id,
        (hist_item->>'hearing_date')::date,
        hist_item->>'judge',
        hist_item->>'purpose_of_hearing',
        hist_item->>'business_on_date',
        hist_item->>'cause_list_type'
      );
    END LOOP;
  END IF;

  RETURN v_legalkart_case_id;
END;
$function$;