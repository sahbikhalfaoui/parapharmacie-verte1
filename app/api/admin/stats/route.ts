import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { User, Order, Product, Category, PageView } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalCategories,
      recentOrders,
      // Analytics data
      todayViews,
      weekViews,
      monthViews,
      uniqueVisitorsToday,
      uniqueVisitorsWeek,
      uniqueVisitorsMonth,
      // Revenue data
      totalRevenue,
      monthRevenue,
      // Top pages
      topPages
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      // Page views
      PageView.countDocuments({ createdAt: { $gte: today } }),
      PageView.countDocuments({ createdAt: { $gte: thisWeek } }),
      PageView.countDocuments({ createdAt: { $gte: thisMonth } }),
      // Unique visitors (by sessionId)
      PageView.distinct('sessionId', { createdAt: { $gte: today } }).then(arr => arr.length),
      PageView.distinct('sessionId', { createdAt: { $gte: thisWeek } }).then(arr => arr.length),
      PageView.distinct('sessionId', { createdAt: { $gte: thisMonth } }).then(arr => arr.length),
      // Revenue
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$finalTotal' } } }
      ]).then(res => res[0]?.total || 0),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, status: { $nin: ['cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$finalTotal' } } }
      ]).then(res => res[0]?.total || 0),
      // Top pages
      PageView.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])
    
    // Daily views for chart (last 7 days)
    const dailyViews = await PageView.aggregate([
      { $match: { createdAt: { $gte: thisWeek } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$sessionId' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          views: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' }
        }
      }
    ])
    
    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    
    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalCategories,
      recentOrders,
      analytics: {
        pageViews: {
          today: todayViews,
          week: weekViews,
          month: monthViews
        },
        uniqueVisitors: {
          today: uniqueVisitorsToday,
          week: uniqueVisitorsWeek,
          month: uniqueVisitorsMonth
        },
        dailyViews,
        topPages,
        revenue: {
          total: totalRevenue,
          month: monthRevenue
        },
        ordersByStatus
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
