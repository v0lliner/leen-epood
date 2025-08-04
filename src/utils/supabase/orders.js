import { supabase } from './client'

export const orderService = {
  // Get order statistics from the admin_order_stats view
  async getOrderStats() {
    try {
      if (import.meta.env.DEV) {
        console.log('📊 OrderService: Fetching order stats...')
      }
      
      const { data, error } = await supabase
        .from('admin_order_stats')
        .select('*')
        .single()

      if (error) {
        if (import.meta.env.DEV) {
          console.error('❌ OrderService: Error fetching order stats:', error)
        }
        return { 
          error, 
          data: {
            total_orders: 0,
            pending_orders: 0,
            paid_orders: 0,
            processing_orders: 0,
            shipped_orders: 0,
            completed_orders: 0,
            cancelled_orders: 0,
            refunded_orders: 0,
            total_revenue: 0,
            confirmed_revenue: 0
          }
        }
      }

      if (import.meta.env.DEV) {
        console.log('✅ OrderService: Order stats fetched successfully:', data)
      }
      return { data, error: null }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('❌ OrderService: Exception fetching order stats:', err)
      }
      return { 
        error: err, 
        data: {
          total_orders: 0,
          pending_orders: 0,
          paid_orders: 0,
          processing_orders: 0,
          shipped_orders: 0,
          completed_orders: 0,
          cancelled_orders: 0,
          refunded_orders: 0,
          total_revenue: 0,
          confirmed_revenue: 0
        }
      }
    }
  },

  // Get all orders for admin view
  async getOrders() {
    try {
      if (import.meta.env.DEV) {
        console.log('📋 OrderService: Fetching orders...')
      }
      
      const { data, error } = await supabase
        .from('admin_orders_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (import.meta.env.DEV) {
          console.error('❌ OrderService: Error fetching orders:', error)
        }
        return { error, data: [] }
      }

      if (import.meta.env.DEV) {
        console.log('✅ OrderService: Orders fetched successfully:', data?.length || 0, 'orders')
      }
      return { data: data || [], error: null }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('❌ OrderService: Exception fetching orders:', err)
      }
      return { error: err, data: [] }
    }
  }
}
