module.exports = {
    name: "referral-ws",
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,
    base_url: process.env.BASE_URL || "http://localhost:3000",
    HOME:"/Users/talatmahmood/",
    db: process.env.MONGODB || "mongodb://test:test123@ds219000.mlab.com:19000/test-mobile-setup",
    redis_port: 6379,
    redis_host: "127.0.0.1"
}