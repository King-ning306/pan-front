<template>
    <div class="image-viewer"></div>
    <el-image-viewer :initial-index="previewImgIndex" 
    hide-on-click-model 
    :url-list="imageList"
    @close="closeImgViewer"
    v-if="previewImgIndex !=null"></el-image-viewer>
</template>
<script setup>
import{ref,reactive,getCurrentInstance,nextTick}from "vue"
const {proxy} =getCurrentInstance();
const previewImgIndex =ref(null);
const props=defineProps({
    imageList:{
        type:Array,
    },
});
const show=(index)=>{
    
    previewImgIndex.value=index;
};
defineExpose({show});
const closeImgViewer=()=>{
    previewImgIndex.value=null;
}

</script>
<style lang="scss" scoped>
.image-viewer {
  .el-image-viewer__mask {
    opacity: 0.7;
  }
}
</style>