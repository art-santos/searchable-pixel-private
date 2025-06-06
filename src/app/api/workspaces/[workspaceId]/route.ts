import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET: Fetch workspace details
export async function GET(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  const cookieStore = await cookies()
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { workspaceId } = params
  
  // Fetch workspace details
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .single()
  
  if (workspaceError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
  }
  
  return NextResponse.json({ workspace })
} 