<template>
  <div>
    <div class="top">
      <div class="top-op">
        <div class="btn">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="FileAccept"
          >
            <el-button type="primary">
              <span class="iconfont icon-upload">上传</span>
            </el-button>
          </el-upload>
        </div>

        <el-button type="success" @click="newFoloder">
          <span class="iconfont icon-folder-add"></span>
          新建文件夹
        </el-button>

        <el-button type="danger"
        :disabled="selectFileIdList.length == 0"
           @click="delFileBatch">
          <span class="iconfont icon-del"
          ></span>
          批量删除
        </el-button>
        <el-button type="warning"
        :disabled="selectFileIdList.length == 0"
          @click="moveFolderBatch">
          <span class="iconfont icon-move" 
          ></span>
          批量移动
        </el-button>
        <div class="search-panel">
          <el-input clearable placeholder="请输入文件名搜索" v-model="fileNameFuzzy" @keyup.enter="search" >
            <template #suffix>
              <i class="iconfont icon-search" @click="search"></i>
            </template>
          </el-input>
        </div>
        <div class="iconfont icon-refresh" @click="loadDataList"></div>
      </div>
      <Navigation ref="navigationRef" @navChange="navChange"></Navigation>
    </div>
    <div class="file-list" v-if="tableData.list&&tableData.list.length>0">
      <Table 
      ref="dataTableRef"
      :columns="columns"
      
      :dataSource="tableData"
      :fetch="loadDataList"
      :initFetch="false"
      :options="tableOptions"
      @rowSelected="rowSelected"
      >
     <template #fileName="{ index, row }">
          <div
            class="file-item"
            @mouseenter="showOp(row)"
            @mouseleave="cancelShowOp(row)"
          >
            <template
              v-if="(row.fileType == 3 || row.fileType == 1) && row.status == 2"
            >
              <icon :cover="row.fileCover" :width="32"></icon>
            </template>
            <template v-else>
              <icon v-if="row.folderType == 0" :fileType="row.fileType"></icon>
              <icon v-if="row.folderType == 1" :fileType="0"></icon>
            </template>
          <span class="file-name" v-if="!(row.showEdit)" :title="row.fileName">
             <span @click="preview(row)">{{row.fileName}}</span>
             <span v-if="row.status ==0" class="transfer-status">转码中</span>
             <span v-if="row.status ==1" class="transfer-status transfer-fail">转码失败</span>
          </span>
          <div class="edit-panel" v-if="row.showEdit">
            <el-input
            v-model.trim="row.fileNameReal"
            ref="editNameRef"
            :maxLength="190"
            @keyup-enter="saveNameEdit(index)"

            >
            <template #suffix>{{row.fileSuffix}}</template>
            </el-input>
            <span
                :class="[
                  'iconfont icon-right1',
                  row.fileNameReal ? '' : 'not-allow',
                ]"  @click="saveNameEdit(index)"
            ></span>
            <span class="iconfont icon-error" @click="cancelNameEdit(index)"></span>
          </div>
          <span class="op" >
            <template v-if="row.showOp&&row.fileId&&row.status==2">
            <span class="iconfont icon-share1">分享</span>
            <!-- 不能下载文件夹 -->
            <span class="iconfont icon-download" v-if="row.folderType==0">下载</span>
            <span class="iconfont icon-del" @click="delFile(row)">删除</span>
            <span class="iconfont icon-edit" @click="editFileName(index)">重命名</span>
            <span class="iconfont icon-move" @click="moveFolder(row)">移动</span>
            
            </template>
          </span>
         

        </div>
      </template>
      <template #fileSize="{ index, row }">
          <span v-if="row.fileSize">
            {{ proxy.Utils.size2Str(row.fileSize) }}</span
          >
        </template>
    </Table>
    </div>
    <div v-else class="no-data">
      <div class="no-data-inner">
        <Icon iconName="no_data" :width="120" fit="fill"></Icon>
        <div class="tips">当前目录为空，上传你的第一个文件吧</div>
        <div class="op-list">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccept"
          >
            <div class="op-item">
              <Icon iconName="file" :width="60"></Icon>
              <div>上传文件</div>
            </div>
          </el-upload>
          <div class="op-item" v-if="category == 'all'" @click="newFolder">
            <Icon iconName="folder" :width="60"></Icon>
            <div>新建目录</div>
          </div>
        </div>
      </div>
    </div>
     <FolderSelect ref="folderSelectRef" @folderSelect="moveFolderDone"></FolderSelect>
  </div>
</template>
<script setup>
import CategoryInfo from "@/js/CategoryInfo.js"
const showLoading=ref(true);
import {ref,reactive,getCurrentInstance,nextTick,computed} from 'vue'
const{proxy}=getCurrentInstance();
//文件回调
const reload = () => {
  showLoading.value = false;
  loadDataList();
};
defineExpose({
  reload,
});
//添加文件
const emit =defineEmits(["addFile"])
const addFile=(fileData)=>{
   emit("addFile",{file:fileData.file,filePid:currentFolder.value.fileId});
};
const currentFolder=ref({fileId:"0"});
 const api = {
  loadDataList: "/file/loadDataList",
  rename: "/file/rename",
  newFoloder: "/file/newFoloder",
  getFolderInfo: "/file/getFolderInfo",
  delFile: "/file/delFile",
  changeFileFolder: "/file/changeFileFolder",
  createDownloadUrl: "/file/createDownloadUrl",
  download: "/api/file/download",
};
const columns = [
  {
    label: "文件名",
    prop: "fileName",
    scopedSlots: "fileName",
  },
  {
    label: "修改时间",
    prop: "lastUpdateTime",
    width: 200,
  },
  {
    label: "大小",
    prop: "fileSize",
    scopedSlots: "fileSize",
    width: 200,
  },
];
//搜索功能
const search=()=>{
  showLoading.value=true;
  loadDataList();
}
//根据目录设置接受文件类型
const fileAccept=computed(()=>{
  const categoryItem= CategoryInfo[category.value];
  return categoryItem ?categoryItem.accept:"*";
})
const fileNameFuzzy=ref();
const tableData =ref({});
const category=ref();
const loadDataList =async()=>{
  let params={
      pageNo:tableData.value.pageNo,
      pageSize:tableData.value.pageSize,
      fileNameFuzzy:fileNameFuzzy.value,
      filePid:currentFolder.value.fileId,
      category:category.value,
    };
    if(params.category!=="all"){
      delete params.filePid;
    }
    let result= await proxy.Request({
      url:api.loadDataList,
      showLoading:showLoading.value,
      params:params,
     
    })
    if(!result){
      return;
    }
    tableData.value=result.data;
};
const tableOptions={
  extHeight:50,
  selectType:"checkbox",
};
//多选
const selectFileIdList=ref([]);
const selectFileList = ref([]);
const rowSelected =(rows)=>{
  selectFileIdList.value=[];
  rows.forEach(item => {
    selectFileIdList.value.push(item.fileId);
 
    
  });
    
};
const editing=ref(false);
const editNameRef=ref();
const newFoloder=()=>{
  if(editing.value){
    return;
  }
  tableData.value.list.forEach(element => {
    element.showEdit=false;
  });
  editing.value=true;
  tableData.value.list.unshift({
    showEdit:true,
    fileType:0,
    fileId:"",
    filePid:0,
  })
  nextTick(()=>{
     editNameRef.value.focus();
  })
}
const cancelNameEdit = (index) => {
  const fileData = tableData.value.list[index];
  if (fileData.fileId) {
    fileData.showEdit = false;
  } else {
    tableData.value.list.splice(index, 1);
  }
  editing.value = false;
};

const saveNameEdit = async (index) => {
  const { fileId, filePid, fileNameReal } = tableData.value.list[index];
  if (fileNameReal == "" || fileNameReal.indexOf("/") != -1) {
    proxy.Message.warning("文件名不能为空且不能含有斜杠");
    return;
  }
  let url = api.rename;
  if (fileId == "") {
    url = api.newFoloder;
  }
  let result = await proxy.Request({
    url: url,
    params: {
      fileId,
      filePid: filePid,
      fileName: fileNameReal,
    },
  });
  if (!result) {
    return;
  }
  tableData.value.list[index] = result.data;
  editing.value = false;
};
const editFileName=(index)=>{
  if(tableData.value.list[0].fileId==""){
    tableData.value.list.splice(0,1);
    // 因为上升了，所以index要减一
    index=index-1;
  }
  tableData.value.list.forEach((element) => {
    element.showEdit = false;
  });
  let cureentData = tableData.value.list[index];
  cureentData.showEdit = true;
  //编辑文件 0.文件
  if(cureentData.folderType==0){
    cureentData.fileNameReal=cureentData.fileName.substring(
      0,
      cureentData.fileName.indexOf(".")
    );
    cureentData.fileSuffix = cureentData.fileName.substring(
      cureentData.fileName.indexOf(".")
    );

  }else{
    cureentData.fileNameReal=cureentData.fileName;
    cureentData.fileSuffix="";
  }
  editing.value=true;
  nextTick(()=>{
    editNameRef.value.focus();
  })
}
const showOp=(row)=>{
  tableData.value.list.forEach(element => {
    element.showOp=false;
  });
  row.showOp=true;
};
const cancelShowOp=(row)=>{
  row.showOp=false;
};
const delFile=(row)=>{
  proxy.Confirm(`你确定要删除【${row.fileName}】吗？删除的文件可以在10天内通过回收站还原`,
  async ()=>{
    let result=await proxy.Request({
      url:api.delFile,
      params:{
        fileIds:row.fileId,
      }
    });
    if(!result){
      return;
    }
    loadDataList();
  }
  )
};

const delFileBatch=()=>{
  if(selectFileIdList.value.length==0){
    return;
  }
  proxy.Confirm(`你确定要删除这些文件吗？删除的文件可在10天内通过回收站还原`,
  async ()=>{
    let result =await proxy.Request({
      url:api.delFile,
      params:{
        fileIds:selectFileIdList.value.join(","),
      },
    });
    if(!result){
      return;
    }
    loadDataList();
  });

}
const currentMoveFile = ref({});
const folderSelectRef=ref();
const moveFolder=(data)=>{
  currentMoveFile.value=data;
   folderSelectRef.value.showFolderDialog();
}
const moveFolderBatch=()=>{
    currentMoveFile.value = {};
  //批量移动如果选择的是文件夹，那么要讲文件夹也过滤
  const excludeFileIdList = [currentFolder.value.fileId];
  selectFileList.value.forEach((item) => {
    if (item.folderType == 1) {
      excludeFileIdList.push(item.fileId);
    }
  });
 
  folderSelectRef.value.showFolderDialog(excludeFileIdList.join(","));
}

const moveFolderDone= async(folderId)=>{
   if(currentMoveFile.value.filePid === folderId ||
    currentFolder.value.fileId == folderId){
    proxy.Message.warning("文件正在当前目录，无需移动");
    return;
   }
   let fileIdsArray=[];
   if(currentMoveFile.value.fileId){
    fileIdsArray.push(currentMoveFile.value.fileId);
   }else{
    fileIdsArray=fileIdsArray.concat(selectFileIdList.value);
   }
   let result=await proxy.Request({
    url:api.changeFileFolder,
    params:{
      fileIds:fileIdsArray.join(","),
      filePid:folderId
    },
   });
   if(!result){
    return;
   }
   //将框关闭
   folderSelectRef.value.close();
   loadDataList();
}
const navigationRef=ref();
//预览
const preview=(data)=>{
  if(data.folderType==1){
     navigationRef.value.openFolder(data);
  }
}
const navChange=(data)=>{
   const {curFolder,categoryId}=data;
   currentFolder.value=curFolder;
   category.value=categoryId;
   loadDataList();
}
</script>
<style lang="scss" scoped>
@import "@/assets/file.list.scss";
</style>