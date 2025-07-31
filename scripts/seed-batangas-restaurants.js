// Seed script for adding Batangas City restaurants to Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase config (matching client configuration)
const firebaseConfig = {
  apiKey: "AIzaSyC401hRK08DgE9mWLCBBdWt67XpLLP-6eE",
  authDomain: "ubianfoodhub.firebaseapp.com",
  projectId: "ubianfoodhub",
  storageBucket: "ubianfoodhub.firebasestorage.app",
  messagingSenderId: "727047776929",
  appId: "1:727047776929:web:2befc0088170ce5e445ee0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Batangas City Restaurant Data
const restaurantsData = [
  {
    name: "Jollibee - Batangas",
    email: "jollibee@foodhub.com",
    category: "Fast Food",
    description: "Philippines' favorite fastfood chain serving burgers, fried chicken, and sweet-style spaghetti",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "15-25 min",
    deliveryFee: "₱39.00",
    priceRange: "₱89-199",
    rating: 4.5,
    reviewCount: 2847,
    menu: [
      { name: "Chickenjoy", price: 89, category: "Main Course", description: "Famous crispy fried chicken with special marinade", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Jolly Spaghetti", price: 75, category: "Main Course", description: "Sweet-style spaghetti with hotdog and cheese", image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Yumburger", price: 45, category: "Main Course", description: "Classic burger with special dressing", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Palabok", price: 85, category: "Main Course", description: "Rice noodles with shrimp sauce and toppings", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Peach Mango Pie", price: 35, category: "Dessert", description: "Crispy pie filled with sweet peach and mango", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Sundae", price: 25, category: "Dessert", description: "Vanilla ice cream with chocolate or strawberry syrup", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pineapple Juice", price: 29, category: "Beverage", description: "Fresh pineapple juice", image: "https://images.unsplash.com/photo-1546173159-315724a31696?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Coke Float", price: 39, category: "Beverage", description: "Coca-Cola with vanilla ice cream", image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chickenjoy Bucket", price: 399, category: "Main Course", description: "8-piece bucket of famous Chickenjoy", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Family Pack Spaghetti", price: 199, category: "Main Course", description: "Large serving of Jolly Spaghetti for sharing", image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "McDonald's - SM Batangas",
    email: "mcdonalds@foodhub.com",
    category: "Fast Food",
    description: "World's leading fast-food restaurant chain serving burgers, fries, and breakfast meals",
    image: "https://images.unsplash.com/photo-1552566268-a8e5c022b5c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "20-30 min",
    deliveryFee: "₱49.00",
    priceRange: "₱69-259",
    rating: 4.3,
    reviewCount: 1923,
    menu: [
      { name: "Big Mac", price: 179, category: "Main Course", description: "Two all-beef patties, special sauce, lettuce, cheese", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Quarter Pounder", price: 199, category: "Main Course", description: "Quarter pound beef patty with cheese", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "McNuggets 6pc", price: 119, category: "Appetizer", description: "Six pieces of chicken McNuggets", image: "https://images.unsplash.com/photo-1562967914-608f82629710?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "McChicken", price: 89, category: "Main Course", description: "Crispy chicken fillet with lettuce and mayo", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "McFlurry Oreo", price: 65, category: "Dessert", description: "Vanilla soft serve with Oreo cookie pieces", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Apple Pie", price: 35, category: "Dessert", description: "Hot apple pie with flaky crust", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "French Fries Large", price: 69, category: "Appetizer", description: "Golden crispy french fries", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "McCafe Iced Coffee", price: 79, category: "Beverage", description: "Premium iced coffee blend", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "McSpicy", price: 139, category: "Main Course", description: "Spicy chicken fillet burger", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Hotcakes", price: 89, category: "Main Course", description: "Three fluffy pancakes with syrup and butter", image: "https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "Chowking - Batangas",
    email: "chowking@foodhub.com",
    category: "Asian",
    description: "Popular Chinese-Filipino restaurant chain serving dimsum, noodles, and rice meals",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "25-35 min",
    deliveryFee: "₱59.00",
    priceRange: "₱79-189",
    rating: 4.2,
    reviewCount: 1456,
    menu: [
      { name: "Chao Fan", price: 89, category: "Main Course", description: "Chinese-style fried rice with eggs and vegetables", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Pork Siomai", price: 69, category: "Appetizer", description: "Steamed pork dumplings with soy sauce", image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Beef Wanton Mami", price: 119, category: "Main Course", description: "Beef noodle soup with wanton dumplings", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Sweet & Sour Pork", price: 149, category: "Main Course", description: "Crispy pork with sweet and sour sauce", image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Fried Chicken Lauriat", price: 179, category: "Main Course", description: "Fried chicken with rice, soup, and drink", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Halo-Halo", price: 75, category: "Dessert", description: "Traditional Filipino shaved ice dessert", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Siopao Asado", price: 45, category: "Snack", description: "Steamed bun with sweet pork filling", image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Fresh Lemonade", price: 39, category: "Beverage", description: "Freshly squeezed lemonade", image: "https://images.unsplash.com/photo-1546173159-315724a31696?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Yang Chow Fried Rice", price: 99, category: "Main Course", description: "Special fried rice with shrimp and Chinese sausage", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pancit Canton", price: 89, category: "Main Course", description: "Stir-fried egg noodles with vegetables", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "KFC - Batangas City",
    email: "kfc@foodhub.com",
    category: "Fast Food",
    description: "Kentucky Fried Chicken - famous for original recipe fried chicken with 11 herbs and spices",
    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "20-30 min",
    deliveryFee: "₱49.00",
    priceRange: "₱99-299",
    rating: 4.4,
    reviewCount: 1678,
    menu: [
      { name: "Original Recipe Chicken", price: 99, category: "Main Course", description: "Famous fried chicken with secret 11 herbs and spices", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Zinger Burger", price: 149, category: "Main Course", description: "Spicy chicken fillet burger with lettuce and mayo", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Bucket Meal 8pcs", price: 599, category: "Main Course", description: "8-piece chicken bucket with gravy and coleslaw", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Hot & Crispy Chicken", price: 109, category: "Main Course", description: "Extra crispy fried chicken", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Coleslaw", price: 49, category: "Appetizer", description: "Fresh cabbage salad with creamy dressing", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Mashed Potato with Gravy", price: 59, category: "Appetizer", description: "Creamy mashed potato with signature gravy", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Krushers Oreo", price: 89, category: "Dessert", description: "Oreo cookie milkshake", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Colonel's Burger", price: 119, category: "Main Course", description: "Original recipe chicken fillet burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Popcorn Chicken", price: 79, category: "Appetizer", description: "Bite-sized pieces of crispy chicken", image: "https://images.unsplash.com/photo-1562967914-608f82629710?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pepsi Float", price: 49, category: "Beverage", description: "Pepsi with vanilla ice cream", image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "Greenwich - Batangas",
    email: "greenwich@foodhub.com",
    category: "Italian",
    description: "Filipino-Italian restaurant chain famous for pizza, pasta, and chicken",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "25-40 min",
    deliveryFee: "₱59.00",
    priceRange: "₱149-399",
    rating: 4.1,
    reviewCount: 1234,
    menu: [
      { name: "Hawaiian Overload Pizza", price: 299, category: "Main Course", description: "Pizza with ham, pineapple, and extra cheese", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Carbonara Supreme", price: 189, category: "Main Course", description: "Creamy pasta with bacon and mushrooms", image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Fried Chicken", price: 119, category: "Main Course", description: "Crispy fried chicken with special seasoning", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pepperoni Pizza", price: 249, category: "Main Course", description: "Classic pizza with pepperoni and mozzarella", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chicken Lasagna", price: 169, category: "Main Course", description: "Layers of pasta with chicken and cheese", image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Garlic Bread", price: 69, category: "Appetizer", description: "Toasted bread with garlic butter", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Baked Ziti", price: 149, category: "Main Course", description: "Baked pasta with meat sauce and cheese", image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Mojos", price: 89, category: "Appetizer", description: "Seasoned potato wedges with dip", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chocolate Cake", price: 79, category: "Dessert", description: "Rich chocolate cake slice", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Iced Tea", price: 39, category: "Beverage", description: "Refreshing iced tea", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "Mang Inasal - Batangas",
    email: "manginasal@foodhub.com",
    category: "Filipino",
    description: "Popular Filipino grilled chicken restaurant with unlimited rice",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "30-45 min",
    deliveryFee: "₱59.00",
    priceRange: "₱99-249",
    rating: 4.3,
    reviewCount: 1567,
    menu: [
      { name: "Chicken Inasal Pecho", price: 129, category: "Main Course", description: "Grilled chicken breast with unlimited rice", image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Pork BBQ", price: 99, category: "Main Course", description: "Grilled pork skewers with rice", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chicken Inasal Paa", price: 109, category: "Main Course", description: "Grilled chicken leg with unlimited rice", image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Bangus Sisig", price: 149, category: "Main Course", description: "Sizzling milkfish sisig with rice", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Liempo", price: 179, category: "Main Course", description: "Grilled pork belly with unlimited rice", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Palabok", price: 89, category: "Main Course", description: "Rice noodles with shrimp sauce", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Halo-Halo", price: 69, category: "Dessert", description: "Traditional Filipino mixed dessert", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Buko Pie", price: 59, category: "Dessert", description: "Coconut pie slice", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Saging Con Yelo", price: 49, category: "Dessert", description: "Banana with crushed ice and milk", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Fresh Buko Juice", price: 45, category: "Beverage", description: "Fresh coconut water", image: "https://images.unsplash.com/photo-1546173159-315724a31696?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "Max's Restaurant - Batangas",
    email: "maxs@foodhub.com",
    category: "Filipino",
    description: "The House That Fried Chicken Built - famous for sarap-to-the-bones fried chicken",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "35-50 min",
    deliveryFee: "₱69.00",
    priceRange: "₱149-399",
    rating: 4.4,
    reviewCount: 1890,
    menu: [
      { name: "Max's Fried Chicken", price: 189, category: "Main Course", description: "Famous sarap-to-the-bones fried chicken", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Kare-Kare", price: 299, category: "Main Course", description: "Oxtail stew in peanut sauce with vegetables", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Crispy Pata", price: 399, category: "Main Course", description: "Deep-fried pork hock served with sauce", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Sinigang na Baboy", price: 249, category: "Main Course", description: "Pork sour soup with vegetables", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pancit Canton", price: 149, category: "Main Course", description: "Stir-fried noodles with vegetables and meat", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Lumpiang Shanghai", price: 119, category: "Appetizer", description: "Fried spring rolls with sweet and sour sauce", image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Caramel Cake", price: 89, category: "Dessert", description: "Signature caramel cake slice", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Buko Pie", price: 79, category: "Dessert", description: "Traditional coconut pie", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Four Seasons Juice", price: 59, category: "Beverage", description: "Mixed fruit juice drink", image: "https://images.unsplash.com/photo-1546173159-315724a31696?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chicken Lollipop", price: 159, category: "Appetizer", description: "Chicken wings shaped like lollipops", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "Yellow Cab Pizza - Batangas",
    email: "yellowcab@foodhub.com",
    category: "Italian",
    description: "New York style pizza restaurant with authentic American taste",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "30-45 min",
    deliveryFee: "₱69.00",
    priceRange: "₱199-499",
    rating: 4.2,
    reviewCount: 987,
    menu: [
      { name: "Manhattan Meatlovers", price: 399, category: "Main Course", description: "Pizza loaded with pepperoni, sausage, ham, and bacon", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "4 Cheese Pizza", price: 349, category: "Main Course", description: "Pizza with mozzarella, cheddar, parmesan, and blue cheese", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Buffalo Wings", price: 199, category: "Appetizer", description: "Spicy chicken wings with blue cheese dip", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Charlie Chan Chicken", price: 329, category: "Main Course", description: "Asian-style chicken pizza with oriental sauce", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Carbonara Pasta", price: 229, category: "Main Course", description: "Creamy pasta with bacon and parmesan", image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Caesar Salad", price: 149, category: "Appetizer", description: "Fresh romaine lettuce with caesar dressing", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "New York Cheesecake", price: 119, category: "Dessert", description: "Classic New York style cheesecake", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Mozzarella Sticks", price: 159, category: "Appetizer", description: "Breaded mozzarella with marinara sauce", image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pepperoni Pizza", price: 299, category: "Main Course", description: "Classic pepperoni pizza with mozzarella", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Iced Tea", price: 49, category: "Beverage", description: "Refreshing iced tea", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "Army Navy Burger + Burrito",
    email: "armynavy@foodhub.com",
    category: "American",
    description: "American-style burgers and burritos with military-inspired theme",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "25-35 min",
    deliveryFee: "₱59.00",
    priceRange: "₱159-299",
    rating: 4.0,
    reviewCount: 756,
    menu: [
      { name: "Liberty Burger", price: 199, category: "Main Course", description: "Beef patty with cheese, lettuce, tomato, and special sauce", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Freedom Fries", price: 89, category: "Appetizer", description: "Crispy french fries with seasoning", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Soldier Burrito", price: 189, category: "Main Course", description: "Beef burrito with beans, rice, and cheese", image: "https://images.unsplash.com/photo-1626700051175-6818013eaa2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Colonel Chicken Burger", price: 179, category: "Main Course", description: "Crispy chicken burger with coleslaw", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Nachos Supreme", price: 149, category: "Appetizer", description: "Tortilla chips with cheese, beef, and toppings", image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Admiral Fish Burger", price: 169, category: "Main Course", description: "Fish fillet burger with tartar sauce", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chocolate Brownie", price: 79, category: "Dessert", description: "Warm chocolate brownie with ice cream", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Onion Rings", price: 99, category: "Appetizer", description: "Crispy battered onion rings", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chicken Quesadilla", price: 159, category: "Main Course", description: "Grilled tortilla with chicken and cheese", image: "https://images.unsplash.com/photo-1626700051175-6818013eaa2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Strawberry Shake", price: 89, category: "Beverage", description: "Creamy strawberry milkshake", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  },
  {
    name: "Shakey's Pizza - Batangas",
    email: "shakeys@foodhub.com",
    category: "Italian",
    description: "America's original pizza place with thin crust pizza and famous chicken",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
    deliveryTime: "35-50 min",
    deliveryFee: "₱69.00",
    priceRange: "₱199-449",
    rating: 4.1,
    reviewCount: 1345,
    menu: [
      { name: "Manager's Choice Pizza", price: 399, category: "Main Course", description: "Pepperoni, mushrooms, Italian sausage, and bell peppers", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200", isPopular: true },
      { name: "Shakey's Special Pizza", price: 449, category: "Main Course", description: "Loaded with pepperoni, sausage, mushrooms, and more", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Chicken 'N' Mojos", price: 299, category: "Main Course", description: "Fried chicken with famous mojos potato", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Garlic Pizza Bread", price: 119, category: "Appetizer", description: "Pizza bread with garlic and herbs", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Pasta Marinara", price: 179, category: "Main Course", description: "Spaghetti with marinara sauce", image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Super Thick Crust Pizza", price: 349, category: "Main Course", description: "Thick crust pizza with choice of toppings", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Bunch of Lunch", price: 159, category: "Main Course", description: "Personal pizza with soup and salad", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Friday's Chocolate Cake", price: 99, category: "Dessert", description: "Rich chocolate cake slice", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Basket of Mojos", price: 149, category: "Appetizer", description: "Seasoned potato wedges with dip", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" },
      { name: "Iced Tea Pitcher", price: 89, category: "Beverage", description: "Pitcher of refreshing iced tea", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" }
    ]
  }
];

// Function to create user account and add restaurant data
async function seedRestaurants() {
  console.log('Starting to seed Batangas restaurants...');
  
  for (const restaurant of restaurantsData) {
    try {
      console.log(`Processing ${restaurant.name}...`);
      
      // Create Firebase Auth account for stall owner
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        restaurant.email, 
        '123456'
      );
      
      const uid = userCredential.user.uid;
      console.log(`Created auth account for ${restaurant.email} with UID: ${uid}`);
      
      // Add user profile to Firestore
      await setDoc(doc(db, 'users', uid), {
        email: restaurant.email,
        fullName: `${restaurant.name} Manager`,
        role: 'stall_owner',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Add restaurant/stall to Firestore
      const stallRef = await addDoc(collection(db, 'stalls'), {
        name: restaurant.name,
        ownerId: uid,
        category: restaurant.category,
        description: restaurant.description,
        image: restaurant.image,
        deliveryTime: restaurant.deliveryTime,
        deliveryFee: restaurant.deliveryFee,
        priceRange: restaurant.priceRange,
        rating: restaurant.rating,
        reviewCount: restaurant.reviewCount,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const stallId = stallRef.id;
      console.log(`Created stall ${restaurant.name} with ID: ${stallId}`);
      
      // Add menu items to Firestore
      for (const menuItem of restaurant.menu) {
        await addDoc(collection(db, 'menuItems'), {
          stallId: stallId,
          name: menuItem.name,
          price: menuItem.price,
          category: menuItem.category,
          description: menuItem.description,
          image: menuItem.image,
          isAvailable: true,
          isPopular: menuItem.isPopular || false,
          customizations: menuItem.customizations || [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log(`Added ${restaurant.menu.length} menu items for ${restaurant.name}`);
      
    } catch (error) {
      console.error(`Error processing ${restaurant.name}:`, error.message);
      if (error.code === 'auth/email-already-in-use') {
        console.log(`Account ${restaurant.email} already exists, skipping...`);
      }
    }
  }
  
  console.log('Finished seeding Batangas restaurants!');
}

// Run the seeding function
seedRestaurants().catch(console.error);