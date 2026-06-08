/**
 * i18n.js
 * Simple internationalization utility for UniEats
 * Supports: English (en), Arabic (ar)
 */

const translations = {
  en: {
    // Auth
    'auth.login': 'Sign In',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.resetPassword': 'Reset Password',
    'auth.loginSuccess': 'Logged in successfully.',
    'auth.registerSuccess': 'Account created successfully.',
    'auth.logoutSuccess': 'Logged out successfully.',
    'auth.invalidCredentials': 'Invalid email or password.',
    'auth.emailRequired': 'Email is required.',
    'auth.passwordRequired': 'Password is required.',
    'auth.passwordMinLength': 'Password must be at least 6 characters.',
    'auth.emailInvalid': 'Invalid email format.',
    'auth.emailExists': 'An account with this email already exists.',

    // Common
    'common.home': 'Home',
    'common.profile': 'Profile',
    'common.orders': 'Orders',
    'common.cart': 'Cart',
    'common.restaurants': 'Restaurants',
    'common.menu': 'Menu',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.price': 'Price',
    'common.total': 'Total',

    // Orders
    'orders.myOrders': 'My Orders',
    'orders.orderHistory': 'Order History',
    'orders.status': 'Status',
    'orders.pending': 'Pending',
    'orders.preparing': 'Preparing',
    'orders.ready': 'Ready',
    'orders.completed': 'Completed',
    'orders.noOrders': 'No orders yet.',
    'orders.createOrder': 'Create Order',

    // Restaurants
    'restaurants.allRestaurants': 'All Restaurants',
    'restaurants.description': 'Description',
    'restaurants.rating': 'Rating',
    'restaurants.deliveryTime': 'Delivery Time',
    'restaurants.noRestaurants': 'No restaurants found.',

    // Validation
    'validation.required': 'This field is required.',
    'validation.invalidEmail': 'Please enter a valid email address.',
    'validation.minLength': 'Must be at least {min} characters.',
    'validation.maxLength': 'Must be no more than {max} characters.',

    // Messages
    'messages.welcomeBack': 'Welcome back!',
    'messages.orderPlaced': 'Order placed successfully.',
    'messages.orderUpdated': 'Order updated successfully.',
    'messages.profileUpdated': 'Profile updated successfully.',
    'messages.errorOccurred': 'An error occurred. Please try again.'
  },

  ar: {
    // Auth
    'auth.login': 'دخول',
    'auth.register': 'إنشاء حساب',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'عنوان البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.name': 'الاسم الكامل',
    'auth.forgotPassword': 'هل نسيت كلمة المرور؟',
    'auth.resetPassword': 'إعادة تعيين كلمة المرور',
    'auth.loginSuccess': 'تم تسجيل الدخول بنجاح.',
    'auth.registerSuccess': 'تم إنشاء الحساب بنجاح.',
    'auth.logoutSuccess': 'تم تسجيل الخروج بنجاح.',
    'auth.invalidCredentials': 'بريد إلكتروني أو كلمة مرور غير صحيحة.',
    'auth.emailRequired': 'البريد الإلكتروني مطلوب.',
    'auth.passwordRequired': 'كلمة المرور مطلوبة.',
    'auth.passwordMinLength': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
    'auth.emailInvalid': 'صيغة البريد الإلكتروني غير صحيحة.',
    'auth.emailExists': 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',

    // Common
    'common.home': 'الرئيسية',
    'common.profile': 'الملف الشخصي',
    'common.orders': 'الطلبات',
    'common.cart': 'السلة',
    'common.restaurants': 'المطاعم',
    'common.menu': 'القائمة',
    'common.search': 'بحث',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.price': 'السعر',
    'common.total': 'الإجمالي',

    // Orders
    'orders.myOrders': 'طلباتي',
    'orders.orderHistory': 'سجل الطلبات',
    'orders.status': 'الحالة',
    'orders.pending': 'قيد الانتظار',
    'orders.preparing': 'جاري التحضير',
    'orders.ready': 'جاهز',
    'orders.completed': 'مكتمل',
    'orders.noOrders': 'لا توجد طلبات حتى الآن.',
    'orders.createOrder': 'إنشاء طلب',

    // Restaurants
    'restaurants.allRestaurants': 'جميع المطاعم',
    'restaurants.description': 'الوصف',
    'restaurants.rating': 'التقييم',
    'restaurants.deliveryTime': 'وقت التسليم',
    'restaurants.noRestaurants': 'لم يتم العثور على مطاعم.',

    // Validation
    'validation.required': 'هذا الحقل مطلوب.',
    'validation.invalidEmail': 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
    'validation.minLength': 'يجب أن يكون على الأقل {min} أحرف.',
    'validation.maxLength': 'يجب ألا يزيد عن {max} أحرف.',

    // Messages
    'messages.welcomeBack': 'أهلا وسهلا بك!',
    'messages.orderPlaced': 'تم تقديم الطلب بنجاح.',
    'messages.orderUpdated': 'تم تحديث الطلب بنجاح.',
    'messages.profileUpdated': 'تم تحديث الملف الشخصي بنجاح.',
    'messages.errorOccurred': 'حدث خطأ. يرجى المحاولة مرة أخرى.'
  }
};

/**
 * Get a translated string
 * @param {string} key - Translation key (e.g., 'auth.login')
 * @param {string} lang - Language code (en, ar)
 * @param {object} params - Parameters for string interpolation
 * @returns {string} Translated string
 */
function t(key, lang = 'en', params = {}) {
  let text = translations[lang]?.[key] || translations['en'][key] || key;

  // Interpolate parameters
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });

  return text;
}

/**
 * Get all translations for a language
 * @param {string} lang - Language code (en, ar)
 * @returns {object} All translations for the language
 */
function getTranslations(lang = 'en') {
  return translations[lang] || translations['en'];
}

/**
 * Add custom translations
 * @param {string} lang - Language code
 * @param {object} customTranslations - Custom translation object
 */
function addTranslations(lang, customTranslations) {
  if (!translations[lang]) {
    translations[lang] = {};
  }
  translations[lang] = { ...translations[lang], ...customTranslations };
}

module.exports = {
  t,
  getTranslations,
  addTranslations
};
