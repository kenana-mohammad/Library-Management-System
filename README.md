# Library Management System API

نظام إدارة مكتبة متكامل تم بناؤه باستخدام Node.js, Express, و MongoDB. النظام يدعم إدارة الأعضاء، المواد، الإعارات، الحجوزات، والتقييمات.

## 🔗 Documentation
[اضغط هنا لعرض تصميم قاعدة البيانات (DATABASE_DESIGN.md)](./DATABASE_DESIGN.md)

##  كيفية التشغيل
1. قم بتثبيت المتطلبات: `npm install`
2. أنشئ ملف `.env` وأضف المتغيرات التالية:
   `PORT=3000`
   `MONGODB_URI=your_mongodb_connection_string`
3. شغل السيرفر: `nodemon app.js`

##  المميزات البرمجية
- منع تكرار الإعارات لنفس المادة.
- حساب تلقائي للغرامات وتحديث المخزون.
- نظام حجز مع أولوية تلقائية.
- نظام تقييمات مرتبط بسجل الإعارات المكتمل.
## Postman collection 
[collection](https://documenter.getpostman.com/view/30469576/2sBXwmQst9)