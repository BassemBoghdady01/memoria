-- MEMÓRIA · trigger functions are never callable over the API.
-- (Public RPCs storefront_catalog / quote_cart / place_order / get_order_confirmation
-- are intentionally callable by anon; admin_* check is_admin() inside.)
revoke execute on function public.audit_row(), public.order_history(), public.order_restock(),
  public.payments_sync(), public.variant_inventory_row(), public.guard_product_delete(), public.touch_updated_at()
  from public, anon, authenticated;
revoke execute on function public.admin_dashboard(timestamptz, timestamptz), public.admin_issue_invoice(uuid),
  public.admin_customers(text) from anon;
