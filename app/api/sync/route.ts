import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { queue } = await request.json()

    if (!Array.isArray(queue)) {
      return NextResponse.json({ error: 'Invalid queue format' }, { status: 400 })
    }

    const results = []

    for (const item of queue) {
      try {
        const { type, table, data } = item

        switch (type) {
          case 'insert':
            const { error: insertError } = await supabase
              .from(table)
              .insert({ ...data, user_id: user.id })
            
            if (insertError) throw insertError
            results.push({ id: item.id, success: true })
            break

          case 'update':
            const { id, ...updateData } = data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: updateError } = await (supabase as any)
              .from(table)
              .update(updateData)
              .eq('id', id)
              .eq('user_id', user.id)
            
            if (updateError) throw updateError
            results.push({ id: item.id, success: true })
            break

          case 'delete':
            const { error: deleteError } = await supabase
              .from(table)
              .delete()
              .eq('id', data.id)
              .eq('user_id', user.id)
            
            if (deleteError) throw deleteError
            results.push({ id: item.id, success: true })
            break

          default:
            results.push({ id: item.id, success: false, error: 'Unknown operation type' })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.push({ id: item.id, success: false, error: message })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Sync error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

