import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// ── JOB OPERATIONS ──

export async function createJob(jobData) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('createJob error:', err)
    return { data: null, error: err.message }
  }
}

export async function updateJob(jobId, updates) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('updateJob error:', err)
    return { data: null, error: err.message }
  }
}

export async function getJob(jobId) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', jobId)
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('getJob error:', err)
    return { data: null, error: err.message }
  }
}

export async function getBenchmarkStats() {
  try {
    const { data, error } = await supabase
      .from('benchmark_genomes')
      .select('*')
      .limit(1000)
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('getBenchmarkStats error:', err)
    return { data: null, error: err.message }
  }
}

export async function logUsage() {
  try {
    await supabase.from('usage_stats').insert([{
      date: new Date().toISOString().split('T')[0],
      analyses_run: 1
    }])
  } catch (err) {
    // Silent fail — usage logging is non-critical
    console.warn('Usage log failed:', err)
  }
}
