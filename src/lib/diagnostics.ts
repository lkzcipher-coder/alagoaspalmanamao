import { supabase } from "@/integrations/supabase/client";

/**
 * Test utility to validate notification system and cleanup
 */
export async function runNotificationDiagnostic() {
  console.group("🔍 Diagnostic: Notification System");
  const results = {
    checks: [] as string[],
    errors: [] as string[],
    adminCount: 0,
    notificationCount: 0
  };

  try {
    // 1. Check Admins
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'admin');
    
    if (adminError) throw adminError;
    results.adminCount = admins?.length || 0;
    console.log(`✅ Found ${results.adminCount} administrators`);
    results.checks.push(`Admins found: ${results.adminCount}`);

    // 2. Check current notifications
    const { count, error: countError } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    results.notificationCount = count || 0;
    console.log(`✅ Total notifications in DB: ${results.notificationCount}`);

    // 3. Test RLS - Check if we can see notifications (current user context)
    const { data: myNotifs, error: myNotifError } = await supabase
      .from('notificacoes')
      .select('id')
      .limit(1);
    
    if (myNotifError) {
      console.warn("⚠️ RLS Check: Could not read notifications. Ensure you are logged in as admin.");
      results.errors.push(`RLS Read Error: ${myNotifError.message}`);
    } else {
      console.log("✅ RLS Read: Successful");
    }

    // 4. Validate Trigger Consistency (Heuristic)
    const { data: comments } = await supabase.from('comentarios').select('id').limit(1);
    const { data: likes } = await supabase.from('video_likes').select('id').limit(1);
    
    if (comments && comments.length > 0) {
      const { data: linkedNotif } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('source_id', comments[0].id)
        .limit(1);
      
      if (!linkedNotif || linkedNotif.length === 0) {
        console.warn("⚠️ Data Integrity: Found comment without notification.");
        results.errors.push("Missing notification for existing comment");
      } else {
        console.log("✅ Data Integrity: Notification link found for sample comment");
      }
    }

  } catch (err: any) {
    console.error("❌ Diagnostic Failed:", err);
    results.errors.push(err.message);
  }

  console.groupEnd();
  return results;
}
