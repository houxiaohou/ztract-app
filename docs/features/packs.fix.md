# 订单支付补充功能

后端接口定义了两个页面，地址是：

STRIPE_SUCCESS_URL=http://localhost:5173/billing/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:5173/billing/cancel

请在本项目中实现这两个页面
1. success 页面：这个页面应该是显示支付结果确认中，同时调用 `@docs/api.json` 中的 /billing/checkout/{session_id} 接口查询支付结果，可能需要轮询调用，成功后显示支付成功按钮，并且自动跳转到首页；
2. cancel 页面：这个页面显示取消支付，自动跳转到 /pricing 页面。