const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const mongoose = require('mongoose');
require('dotenv').config();

const PRODUCTS = [
    {
        product_name: 'Cold Pressed Coconut Oil (With Sulphur)',
        category: 'Coconut Oils',
        description: 'Traditional wood-pressed coconut oil infused with purified sulphur for scalp therapy.',
        price: 180,
        stock_quantity: 50,
        image_url: '/img2.jpg',
        sizes: ['250ml', '500ml', '1L'],
        benefits: ['Reduces Dandruff', 'Scalp Care'],
        itemType: 'sale'
    },
    {
        product_name: 'Cold Pressed Coconut Oil (Without Sulphur)',
        category: 'Coconut Oils',
        description: '100% pure virgin wood-pressed coconut oil for cooking and body care.',
        price: 420,
        stock_quantity: 60,
        image_url: '/img3.jpg',
        sizes: ['500ml', '1L', '5L'],
        benefits: ['Purity Guaranteed', 'Multi-purpose'],
        itemType: 'sale'
    },
    {
        product_name: 'Baby Coconut Oil',
        category: 'Personal Care',
        description: 'Ultra-mild filtered coconut oil for delicate baby skin.',
        price: 220,
        stock_quantity: 30,
        image_url: '/img10.jpg',
        sizes: ['100ml', '200ml'],
        benefits: ['Skin Friendly', 'No Additives'],
        itemType: 'sale'
    },
    {
        product_name: 'Coconut Shell Bird Nest',
        category: 'Eco Products',
        description: 'Sustainable coconut shell bird feeders and nests.',
        price: 149,
        stock_quantity: 40,
        image_url: '/img6.jpeg',
        sizes: ['Small', 'Medium'],
        benefits: ['Eco Friendly', 'Handcrafted'],
        itemType: 'sale'
    },
    {
        product_name: 'Coconut Shell Bowl',
        category: 'Kitchenware',
        description: 'Polished shell bowls for organic dining experience.',
        price: 120,
        stock_quantity: 25,
        image_url: '/img7.jpg',
        sizes: ['Medium'],
        benefits: ['Unique Texture', 'Food Safe'],
        itemType: 'sale'
    },
    {
        product_name: 'Coconut Shell Bulk (Wholesale)',
        category: 'Industrial',
        description: 'Raw coconut shells in bulk for industrial use or large-scale crafting.',
        price: 500,
        stock_quantity: 100,
        image_url: '/img11.jpg',
        sizes: ['10kg', '50kg'],
        benefits: ['Bulk Savings', 'Industrial Grade'],
        itemType: 'sale'
    }
];

const RENTALS = [
    {
        product_name: 'Industrial Drying Mats',
        price: 50,
        rentalType: 'Day',
        status: 'Available',
        category: 'Drying',
        specs: { material: 'Heavy Duty HDPE', size: '10x10 ft', durability: 'High' },
        description: 'Premium quality mats designed for optimal copra sun-drying. Heat resistant and easy to clean.',
        itemType: 'rental',
        rentalPeriod: 'Day'
    },
    {
        product_name: 'Coconut Cutting Machine',
        price: 800,
        rentalType: 'Day',
        status: 'Available',
        category: 'Processing',
        specs: { power: '2HP Electric', capacity: '300 units/hr', safety: 'Covered Blade' },
        description: 'Efficient semi-automatic machine for precise coconut splitting and preparation.',
        itemType: 'rental',
        rentalPeriod: 'Day'
    }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Seed: Connected to MongoDB');
        await Product.deleteMany({});
        await Inventory.deleteMany({});

        const createdProducts = await Product.insertMany([...PRODUCTS, ...RENTALS]);

        const inventoryRecords = createdProducts.filter(p => p.itemType !== 'rental').map(p => ({
            product: p._id,
            available_stock: p.stock_quantity,
            minimum_stock_level: 10
        }));

        await Inventory.insertMany(inventoryRecords);

        console.log('Seed: Products, Rentals, and Inventory created successfully');
        process.exit();
    })
    .catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
