<template>
  <div class="qingshi-body">
    <div class="qingshi-content-header">
      <a href="">
        <img src="../../img/logo.png" alt="" class="logo">
      </a>
      <span class="desc">创造信息价值!</span>
      <div class="expand"></div>
      <a href="">返回轻识</a>
    </div>
    <div class="qingshi-content">
      <div class="aside-menu">
        <div class="aside-animation">
          <LottieAnimation :animation-data="aiJSON" :auto-play="true" :loop="true" :speed="1" ref="anim" />
          <span>AI</span>
        </div>
        <div class="menu-list">
          <div class="menu-item">
            <img src="../../img/message.png" alt="">
            <span>对话</span>
          </div>
        </div>
        <div class="links">
          <a href="">设置</a>
          <a href="">隐私政策</a>
          <a href="">用户协议</a>
          <a href="">关于我们</a>
        </div>

      </div>

      <div class="flex flex-col chat-wrapper">
        <!-- <div class="flex flex-nowrap fixed w-full items-baseline top-0 px-6 py-4 bg-gray-100">
          <div class="text-2xl font-bold">RobAI</div>
          <div class="ml-4 text-sm text-gray-500">
            每次沟通都是一次信息脉搏的跳动
          </div>
        </div> -->

        <div class="flex-1 mx-2 mb-2 chatListDom">
          <!-- 循环messageList打印-->
          <div class="group flex flex-col px-4 py-3 hover:bg-slate-100 rounded-lg"
            v-for="item of messageList.filter((v) => v.role !== 'web')">
            <div class="flex justify-between items-center mb-2">
              <!-- 显示角色-->
              <div class="font-bold">{{ roleAlias[item.role] }}：</div>
              <!-- 拷贝到剪切板-->
              <Copy class="invisible group-hover:visible" :content="item.content" />
            </div>
            <div>
              <!--显示对话内容-->
              <div class="prose text-sm text-slate-600 leading-relaxed" v-if="item.content"
                v-html="md.render(item.content)">
              </div>
              <Loading v-else />
            </div>
          </div>
        </div>

        <div class="sticky bottom-0 w-full p-6 pb-8">
          <div class="flex">
            <input class="input" :type="'text'" :placeholder="'你可以问我任何问题...'" v-model="userSay"
              @keydown.enter="isTalking || sendMessage()" />
            <button class="btn" :disabled="isTalking" @click="sendMessage()">
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="text-center beian">
      <a href="https://beian.miit.gov.cn/" target="_blank">
        浙ICP备2023012570号-1
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import Copy from "@/components/Copy.vue";
import Loading from "@/components/Loding.vue";
import { md } from "@/libs/markdown";
import type { ChatMessage } from "@/types";
import { nextTick, onMounted, ref, watch } from "vue";

import { LottieAnimation } from "lottie-web-vue";
import aiJSON from "../../img/ai.json";

let anim = ref()

onMounted(() => {
  setTimeout(() => {
    console.log(anim.value.goToAndPlay(150, true))
    anim.value
  }, 500)
})

let isTalking = ref(false);
let userSay = ref("");
const chatListDom = ref<HTMLDivElement>();
const roleAlias = { user: "ME", assistant: "AI", web: "WEB" };
const messageList = ref<ChatMessage[]>([
  {
    role: "assistant",
    content: `你好，我是RobAI语言模型，我可以提供一些常用服务和信息，例如：

1. 翻译：我可以把中文翻译成英文，英文翻译成中文，还有其他一些语言翻译，比如法语、日语、西班牙语等。

2. 咨询：如果你有任何问题需要咨询，例如健康、法律、投资等方面，我可以尽可能为你提供帮助。

3. 闲聊：如果你感到寂寞或无聊，我们可以聊一些有趣的话题，以减轻你的压力。

4. 学术讨论: 如果你有学术相关的问题需要咨询,我会尽可能给你提供专业的资讯和信息。

5. 内容生成: 如果你需要生成文稿,ppt,excel,代码等等内容,能按照你的要求生成和编辑修改

请告诉我你需要哪方面的帮助，我会根据你的需求给你提供相应的信息和建议。`,
  },
]);

let ws = new WebSocket("wss://www.robai.cc/ws");
ws.addEventListener('error', (event) => {
  console.error('WebSocket 连接建立失败：', event);
});

//刷新页面和关闭页面,关闭ws
window.onbeforeunload = function () {
  if (ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
};

onMounted(() => {

  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("ping");
    }
  }, 5000);

  ws.onopen = () => {
    console.log("WebSocket 连接成功！");
    clearMessageContent();
  };
  //接受服务端发送过来的消息
  ws.onmessage = (event) => {
    if (event.data === "pong") {
      //心跳包
      console.log("heartBeat.")
      return;
    }
    const data = JSON.parse(event.data);
    if (data.init) {
      //初始化返回sessionId
      console.log("连接初始化成功，session id 为:", data.message);
      localStorage.setItem("sessionId", data.message);
      return;
    }
    if (data.last) {
      //单轮对话完成
      console.log("对话完成")
      isTalking.value = false;
      return;
    }
    appendLastMessageContent(data.message);
  };
  ws.onerror = (event) => {
    console.error("WebSocket 发生错误：", event);
    messageList.value = [];
    messageList.value.push({ role: "web", content: "_客官,服务出现了一些问题,稍作休息,等一会访问啦!_" });
  };
  //接受服务端发送过来的消息
  ws.onclose = (event) => {
    console.log("WebSocket 连接已关闭。", event);
  };
});

const sendChatMessage = async (content: string = userSay.value) => {
  try {
    if (messageList.value.length === 1) {
      messageList.value.pop();
    }
    messageList.value.push({ role: "user", content });
    clearMessageContent();
    messageList.value.push({ role: "assistant", content: "" });
    //发送消息到ws
    let sessionId = localStorage.getItem("sessionId");
    let timestamp = new Date().getTime();
    let message = {
      sessionId: sessionId,
      message: content,
      requestId: "ws_" + timestamp.toString(),
      requestTime: timestamp
    };
    if (ws.readyState != WebSocket.OPEN) {
      messageList.value.push({ role: "web", content: "服务出现了一些问题,需要稍等一会访问啦!" });
      return;
    }
    ws.send(JSON.stringify(message));
  } catch (error: any) {
    console.error("发送消息发生了错误：", error);
    messageList.value.push({ role: "web", content: "服务出现了一些问题,需要稍等一会访问啦!" });
  }
};


const appendLastMessageContent = (content: string) => {
  const lastMessage = messageList.value[messageList.value.length - 1];
  lastMessage.content += content;
}


const sendMessage = () => {
  if (isTalking.value) {
    return;
  }
  if (!userSay.value || userSay.value.length < 1) {
    return;
  }
  isTalking.value = true;
  sendChatMessage();
};

const clearMessageContent = () => (userSay.value = "");

const scrollToBottom = () => {
  if (!chatListDom.value) return;
  scrollTo(0, chatListDom.value!.scrollHeight);
};

watch(messageList.value, () => nextTick(() => scrollToBottom()));
</script>

<style scoped>
a {
  color: #9195a3;
  font-size: 14px;
  transition: 0.2s ease;
}

a:hover {
  text-decoration: underline;
  color: #006eff;
}

.qingshi-body {
  background-color: #eaf2ff;
  padding: 0 15px;
  min-height: 100vh;
}

.qingshi-content {
  /* background-color: white; */
  border-radius: 20px;
  overflow: hidden;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  min-height: 700px;
  display: flex;
}

.qingshi-content-header {
  display: flex;
  align-items: center;
  padding: 30px 0px;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.qingshi-content-header img {
  height: 30px;
}

.qingshi-content-header .desc {
  font-size: 14px;
  color: #9195a3;
  padding-left: 30px;
}

.expand {
  flex: 1;
}

.aside-menu {
  display: flex;
  flex-direction: column;
  padding: 30px;
  width: 300px;
  background-color: white;
}

.aside-animation {
  position: relative;
  width: 150px;
  margin: 0 auto;
  margin-bottom: 30px;
}

.aside-animation span {
  position: absolute;
  top: 50px;
  left: 50%;
  margin-left: -15px;
  font-size: 30px;
  font-weight: bold;
  /* color: #006eff; */
  color: white;

}

.menu-list {
  flex: 1;
}

.aside-menu .links a {
  display: block;
  height: 44px;
  line-height: 44px;
}

.menu-list .menu-item {
  display: flex;
  align-items: center;
  height: 44px;
  background-color: #eaf2ff;
  border-radius: 6px;
  padding-left: 30px;
}

.menu-item img {
  height: 20px;
  margin-right: 10px;
}

.menu-item span {
  color: #006eff;
  font-weight: bold;
  font-size: 16px;
}

.chat-wrapper {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.6);
}

.sticky .input {
  border-radius: 30px;
  box-shadow: 0 4px 16px 0 #eaf2ff;
  height: 44px;
  border: none;
  padding: 0 25px;
  font-size: 16px;
}

.sticky .btn {
  border-radius: 30px;
  padding: 0 30px;
  font-size: 16px;
  font-weight: normal;
}

.beian {
  padding: 15px 0;
}

.beian a {
  font-size: 12px;
}
</style>
