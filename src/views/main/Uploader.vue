<template>
  <div class="uploader-panel">
    <div class="uploader-title">
      <span>上传任务</span>
      <span class="tips">（仅展示本次上传任务）</span>
    </div>
    <div class="file-list">
      <div v-for="(item, index) in fileList" class="file-item">
        <div class="upload-panel">
          <div class="file-name">
            {{ item.fileName }}
          </div>

          <div class="progress">
            <el-progress
              :percentage="item.uploadProgress"
              v-if="
                item.status == STATUS.uploading.value ||
                item.status == STATUS.upload_seconds.value ||
                item.status == STATUS.upload_finish
              "
            />
          </div>
          <div class="upload-status">
            <!--图标-->
            <span
              :class="['iconfont', 'icon-' + STATUS[item.status].icon]"
              :style="{ color: STATUS[item.status].color }"
            ></span>
            <!--状态描述-->
            <span
              class="status"
              :style="{ color: STATUS[item.status].color }"
              >{{
                item.status == "fail" ? item.errorMsg : STATUS[item.status].desc
              }}</span
            >
            <!-- 上传中 -->
            <span
              class="upload-info"
              v-if="item.status == STATUS.uploading.value"
            >
              {{ proxy.Utils.size2Str(item.uploadSize) }}/{{
                proxy.Utils.size2Str(item.totalSize)
              }}
            </span>
          </div>
        </div>
        <div class="op">
          <el-progress
            type="circle"
            :width="50"
            :percentage="item.md5Progress"
            v-if="item.status == STATUS.init.value"
          />
          <div class="op-btn">
            <span v-if="item.status == STATUS.uploading.value">
              <Icon
                :width="28"
                class="btn-item"
                iconName="upload"
                v-if="item.pause"
                title="上传"
                @click="startUpload(item.uid)"
              ></Icon>
              <Icon
                :width="28"
                class="btn-item"
                iconName="pause"
                title="暂停"
                @click="pauseUpload(item.uid)"
              ></Icon>
            </span>
            <!-- 在上传过程中删除 -->
            <Icon
              :width="28"
              class="btn-item del"
              iconName="del"
              title="删除"
              v-if="
                item.status != STATUS.init.value &&
                item.status != STATUS.upload_finish.value &&
                item.status != STATUS.upload_seconds.value
              "
              @click="delUpload(item.uid, index)"
            ></Icon>
            <!-- 上传完之后删除文件 -->
            <Icon
              :width="28"
              class="btn-item clean"
              iconName="clean"
              title="清除"
              v-if="
                item.status == STATUS.upload_finish.value ||
                item.status == STATUS.upload_seconds.value
              "
              @click="delUpload(item.uid, index)"
            ></Icon>
          </div>
        </div>
      </div>
      <div v-if="fileList.length == 0">
        <NoData msg="暂无上传任务"></NoData>
      </div>
    </div>
  </div>
</template>
<script setup>
import SparkMD5 from "spark-md5";
import { ref, reactive, getCurrentInstance, nextTick, computed } from "vue";
const { proxy } = getCurrentInstance();
const api = {
  upload: "/file/uploadFile",
};
const STATUS = {
  emptyfile: {
    value: "emptyfile",
    desc: "文件为空",
    color: "#F75000",
    icon: "close",
  },
  fail: {
    value: "fail",
    desc: "上传失败",
    color: "#F75000",
    icon: "close",
  },
  init: {
    value: "init",
    desc: "解析中",
    color: "#e6a23c",
    icon: "clock",
  },
  uploading: {
    value: "uploading",
    desc: "上传中",
    color: "#409eff",
    icon: "upload",
  },
  upload_finish: {
    value: "upload_finish",
    desc: "上传完成",
    color: "#67c23a",
    icon: "ok",
  },
  upload_seconds: {
    value: "upload_seconds",
    desc: "秒传",
    color: "#67c23a",
    icon: "ok",
  },
};
const chunkSize=1024*1024
const delList=ref([]);
const fileList = ref([]);
const addFile = async (file, filePid) => {
  const fileItem = {
    file: file,
    uid: file.uid,
    md5Progress: 0,
    md5: null,
    fileName: file.name,
    status: STATUS.init.value,

    uploadSize: 0,
    totalSize: file.size,

    uploadProgress: 0,
    pause: false,

    chunkIndex: 0,

    filePid: filePid,

    errorMsg: null,
  };
  fileList.value.unshift(fileItem);
  //空文件设置不用上传
  if(fileItem.totalSize==0){
    fileItem.status=STATUS.emptyfile.value;
    return;
  }
  let md5FileUid = await computeMd5(fileItem);
  if(md5FileUid==null){
    return;
  } 
  uploadFile(md5FileUid);
};
defineExpose({
  addFile,
});
const startUpload=(uid)=>{

};
const delUpload=(uid,index)=>{

}
const pauseUpload=(uid)=>{

}
// 计算md5
const computeMd5=(fileItem)=>{
   let file=fileItem.file;
   let blobSlice = File.prototype.slice ||
    File.prototype.mozSlice ||
    File.prototype.webkitSlice;
    //计算分的片数
    let chunks=Math.ceil(file.size/chunkSize);
    
    let currentChunk=0;
    let spark=new SparkMD5.ArrayBuffer();
    let fileReader=new FileReader();

    let loadNext=()=>{
      let start =currentChunk*chunkSize;
      let end=start*chunkSize>=file.size?file.size:start+chunkSize;
      fileReader.readAsArrayBuffer(blobSlice.call(file,start,end));
    }
    loadNext();
      return new Promise((resolve, reject) => {
    let resultFile = getFileByUid(file.uid);
    fileReader.onload = (e) => {
      spark.append(e.target.result); // Append array buffer
      currentChunk++;
      if (currentChunk < chunks) {
        console.log(`第${file.name},${currentChunk}分片解析完成`)
        let percent = Math.floor((currentChunk / chunks) * 100);
        resultFile.md5Progress = percent;
        loadNext();
      } else {
        let md5 = spark.end();
         
        spark.destroy(); //释放缓存
       
        resultFile.md5Progress = 100;
        resultFile.status = STATUS.uploading.value;
        resultFile.md5 = md5;
        resolve(fileItem.uid);
      }
    };
    fileReader.onerror = () => {
      resultFile.md5Progress = -1;
      resultFile.status = STATUS.fail.value;
      resolve(fileItem.uid);
    };
  }).catch((error) => {
    console.log(error);
    return null;
  });
};
const getFileByUid=(uid)=>{
  let file=fileList.value.find(item=>{
    return item.file.uid===uid;
  })
  return file;
}

const emit = defineEmits(["uploadCallback"]);
const uploadFile=async (uid,chunkIndex)=>{
  chunkIndex =chunkIndex?chunkIndex:0;
  //分片上传
  let currentFile=getFileByUid(uid);
  const file=currentFile.file;
  const fileSize=currentFile.totalSize;
  const chunks=Math.ceil(fileSize/chunkSize);
  for(let i=chunkIndex;i<chunks;i++){
    let delIndex=delList.value.indexOf(uid);
    if(delIndex!=-1){
      //删掉
      delList.value.splice(delIndex,1);
      break;
    }
    currentFile=getFileByUid(uid);
    if(currentFile.pause){
      break;
    }
    let start=i*chunkSize;
    let end=start+chunkSize>=fileSize?fileSize:start+chunkSize;
    let chunkFile=file.slice(start,end);
    let uploadResult=await proxy.Request({
      url:api.upload,
      showLoading:false,
      dataType:"file",
      params:{
        file:chunkFile,
        fileName:file.name,
        fileMd5:currentFile.md5,
        chunkIndex:i,
        chunks:chunks,
        filePid:currentFile.filePid,
        fileId:currentFile.fileId,

      },
      showError:false,
      errorCallback:(errorMsg)=>{
        currentFile.errorMsg=errorMsg;
        currentFile.status=STATUS.fail.value;
      },
      uploadProgressCallback:(event)=>{
        let loaded=event.loaded;
        if(fileSize<loaded){
          loaded=fileSize;
        }
        currentFile.uploadSize=i*chunkSize+loaded;
        currentFile.uploadProgress=Math.floor((currentFile.uploadSize/fileSize)*100);
      },
    });
    if(uploadResult==null){
      break;
    }
    currentFile.fileId=uploadResult.data.fileId;
    currentFile.status=STATUS[uploadResult.data.status].value;
    currentFile.chunkIndex=i;
    if (
      uploadResult.data.status == STATUS.upload_seconds.value ||
      uploadResult.data.status == STATUS.upload_finish.value
    ) {
      currentFile.uploadProgress = 100;
      emit("uploadCallback");
      break;
    }

  }



}
</script>
<style lang="scss" scoped>
.uploader-panel {
  .uploader-title {
    border-bottom: 1px solid #ddd;
    line-height: 40px;
    padding: 0px 10px;
    font-size: 15px;
    .tips {
      font-size: 13px;
      color: rgb(169, 169, 169);
    }
  }
  .file-list {
    overflow: auto;
    padding: 10px 0px;
    min-height: calc(100vh / 2);
    max-height: calc(100vh - 120px);
    .file-item {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3px 10px;
      background-color: #fff;
      border-bottom: 1px solid #ddd;
    }
    .file-item:nth-child(even) {
      background-color: #fcf8f4;
    }
    .upload-panel {
      flex: 1;
      .file-name {
        color: rgb(64, 62, 62);
      }
      .upload-status {
        display: flex;
        align-items: center;
        margin-top: 5px;
        .iconfont {
          margin-right: 3px;
        }
        .status {
          color: red;
          font-size: 13px;
        }
        .upload-info {
          margin-left: 5px;
          font-size: 12px;
          color: rgb(112, 111, 111);
        }
      }
      .progress {
        height: 10px;
      }
    }
    .op {
      width: 100px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      .op-btn {
        .btn-item {
          cursor: pointer;
        }
        .del,
        .clean {
          margin-left: 5px;
        }
      }
    }
  }
}
</style>
