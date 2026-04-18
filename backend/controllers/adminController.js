const Order = require('../models/Order');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Product = require('../models/Product');

exports.getDashboardStats = async (req, res) => {
    console.log("Fetching Dashboard Stats for user:", req.user?.id);
    try {
        // 1. Calculate Net Revenue
        console.log("Step 1: Revenue");
        const orders = await Order.find({ payment_status: 'Completed' });
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

        // 2. Count Pending Orders
        console.log("Step 2: Pending Orders");
        const pendingOrders = await Order.countDocuments({ order_status: { $ne: 'Delivered' } });

        // 3. Count Pending Bookings
        console.log("Step 3: Bookings");
        const activeBookings = await Booking.countDocuments({ booking_status: 'Pending' });

        // 4. Total Customers
        console.log("Step 4: Customers");
        const totalCustomers = await User.countDocuments({ role: 'USER' });

        // 5. Recent Activity Logs
        console.log("Step 5: Logs");
        const recentOrders = await Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(3);
        const recentBookings = await Booking.find().populate('user', 'name').sort({ createdAt: -1 }).limit(2);

        const logs = [
            ...recentOrders.map(o => ({
                id: o._id,
                type: 'ORDER',
                title: 'New Order',
                desc: `${o.user?.name || 'Guest'} placed Order #${o._id.toString().slice(-6).toUpperCase()}`,
                time: o.createdAt
            })),
            ...recentBookings.map(b => ({
                id: b._id,
                type: 'BOOKING',
                title: 'Yard Booking',
                desc: `Space reserved by ${b.user?.name || 'Customer'}`,
                time: b.createdAt
            }))
        ].sort((a, b) => b.time - a.time).slice(0, 5);

        // 6. Simple Revenue Chart Data (Last 7 days)
        console.log("Step 6: Chart Data");
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            return d;
        }).reverse();

        const chartData = await Promise.all(last7Days.map(async (date) => {
            const startOfDay = new Date(date);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const dayOrders = await Order.find({
                payment_status: 'Completed',
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            const revenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue
            };
        }));

        // 7. Sales by Category
        const products = await Product.find();
        const categorySales = {};
        for (const order of orders) {
            // Note: This requires OrderItems to be populated or stored in Order
            // For now, let's use a simplified version based on total_amount if category info is not in Order
        }

        // Let's implement a more useful "Inventory Health" for reports
        const inventoryHealth = {
            lowStock: await Product.countDocuments({ stock_quantity: { $lt: 10 } }),
            outOfStock: await Product.countDocuments({ stock_quantity: 0 }),
            totalItems: await Product.countDocuments()
        };

        // 8. Monthly Projection
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);
        const monthOrders = await Order.find({
            payment_status: 'Completed',
            createdAt: { $gte: currentMonthStart }
        });
        const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        res.json({
            success: true,
            stats: {
                totalRevenue,
                pendingOrders,
                activeBookings,
                totalCustomers,
                monthRevenue,
                inventoryHealth
            },
            logs,
            chartData
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
