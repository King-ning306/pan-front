import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/assets/icon/iconfont.css'
import '@/assets/base.scss'
import Verify from'@/utils/Verify'
import Message from'@/utils/Message'
import Request from './utils/Request'
import Confirm from './utils/Confirm'
import Utils from '@/utils/Utils'
//引入cookies
import VueCookies from 'vue-cookies'
//自定义组件
import Dialog from '@/components/Dialog.vue'
import Avatar from '@/components/Avatar.vue'
import Table from '@/components/Table.vue'
import Icon from '@/components/Icon.vue'


const app = createApp(App)
app.use(ElementPlus)
app.component("Dialog",Dialog)
app.component("Avatar",Avatar)
app.component("Table",Table)
app.component("Icon",Icon)

app.use(router)
//配置全局组件
app.config.globalProperties.Confirm=Confirm
app.config.globalProperties.Verify=Verify
app.config.globalProperties.Message=Message
app.config.globalProperties.Request=Request
app.config.globalProperties.VueCookies=VueCookies
app.config.globalProperties.Utils=Utils

app.config.globalProperties.globalInfo={
     avatarUrl:"/api/getAvatar/",
     imageUrl:"/api/file/getImage/"
}
app.mount('#app')
