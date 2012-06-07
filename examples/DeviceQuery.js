// Copyright (c) 2011-2012, Motorola Mobility, Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//  * Neither the name of the Motorola Mobility, Inc. nor the names of its
//    contributors may be used to endorse or promote products derived from this
//    software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var nodejs = (typeof window === 'undefined');
if(nodejs) {
  WebCL = require('../webcl');
  clu = require('../lib/clUtils');
  util = require('util');
  log = console.log;
}

var cl=new WebCL();

//list of platforms
log("OpenCL SW Info:\n");
var platforms=cl.getPlatforms();
console.log('Found '+platforms.length+' plaforms');
platforms.forEach(function(p) {
  //log("  Plaftorm ID: 0x"+p.getID().toString(16));
  log("  PLATFORM_NAME: \t"+p.getInfo(cl.PLATFORM_NAME));
  log("  PLATFORM_PROFILE: \t"+p.getInfo(cl.PLATFORM_PROFILE));
  log("  PLATFORM_VERSION: \t"+p.getInfo(cl.PLATFORM_VERSION));
  log("  PLATFORM_VENDOR: \t"+p.getInfo(cl.PLATFORM_VENDOR));

  // PLATFORM_EXTENSIONS: get platform extensions, and if any then parse & log the string onto separate lines
  log("  PLATFORM_EXTENSIONS:");
  var platform_ext_string=p.getInfo(cl.PLATFORM_EXTENSIONS);
  if (platform_ext_string.length > 0) 
  {
    var extensions=platform_ext_string.trim().split(' ');
    for(var i=0;i<extensions.length;i++) {
      log("\t\t\t\t\t"+extensions[i]);
    }
  }
  else 
    log("\t\t\t\t\tNone");
  log();

  //list for devices for a platform
  log("OpenCL Device Info:\n");
  var devices = p.getDevices(cl.DEVICE_TYPE_ALL);
  log('Found '+devices.length+' devices');
  devices.forEach(function(device) {
    log(" ---------------------------------");
    log(' Device: '+device.getInfo(cl.DEVICE_NAME));
    log(" ---------------------------------");
    printDeviceInfo(device);
  
    //Create a context for the devices
    var context;
    try {
      context = cl.createContext({ 
        devices: device,
        platform: p} ); //cl.createContext(cl.DEVICE_TYPE_DEFAULT, [cl.CONTEXT_PLATFORM, p]);
    }
    catch(ex) {
      log("createContext() exception: "+ex);
      log();
      log("*************************************************");
      log("* ERROR: Can NOT create context for this device *");
      log("*************************************************");
      log();
      return;
    }
    
    var ctxDevices=context.getInfo(cl.CONTEXT_DEVICES);
    
    // Determine and show image format support 
    // 2D
    ImageFormats=context.getSupportedImageFormats(cl.MEM_READ_ONLY, cl.MEM_OBJECT_IMAGE2D);
    uiNumSupportedFormats=ImageFormats.length;
    
    log("  ---------------------------------");
    log("  2D Image Formats Supported", uiNumSupportedFormats); 
    log("  ---------------------------------");
    log(clu.sprintf("%-6s%-16s%-22s\n", "#", "Channel Order", "Channel Type"));
    for(var j = 0; j < uiNumSupportedFormats; j++) 
    {  
      log(clu.sprintf("  %-6u%-16s%-22s", (j + 1),
          oclImageFormatString(ImageFormats[j].order), 
          oclImageFormatString(ImageFormats[j].data_type)));
    }
    log("");
    
    // 3D
    ImageFormats=context.getSupportedImageFormats(cl.MEM_READ_ONLY, cl.MEM_OBJECT_IMAGE3D);
    uiNumSupportedFormats=ImageFormats.length;
    
    log("  ---------------------------------");
    log("  3D Image Formats Supported", uiNumSupportedFormats); 
    log("  ---------------------------------");
    log(clu.sprintf("%-6s%-16s%-22s\n", "#", "Channel Order", "Channel Type"));
    for(var j = 0; j < uiNumSupportedFormats; j++) 
    {  
      log(clu.sprintf("  %-6u%-16s%-22s", (j + 1),
          oclImageFormatString(ImageFormats[j].order), 
          oclImageFormatString(ImageFormats[j].data_type)));
    }
    log(""); 
  });
  
  // Size of basic types
  log("  size of char: \t"+cl.size.CHAR);
  log("  size of short: \t"+cl.size.SHORT);
  log("  size of int: \t"+cl.size.INT);
  log("  size of long: \t"+cl.size.LONG);
  log("  size of float: \t"+cl.size.FLOAT);
  log("  size of double: \t"+cl.size.DOUBLE);
  log("  size of half: \t"+cl.size.HALF);
});

function printDeviceInfo(device)
{
  log("  DEVICE_NAME: \t\t\t"+device.getInfo(cl.DEVICE_NAME));
  log("  DEVICE_VENDOR: \t\t\t"+device.getInfo(cl.DEVICE_VENDOR));
  log("  DRIVER_VERSION: \t\t\t"+device.getInfo(cl.DRIVER_VERSION));
  log("  DEVICE_VERSION: \t\t\t"+device.getInfo(cl.DEVICE_VERSION));
  log("  DEVICE_PROFILE: \t\t\t"+device.getInfo(cl.DEVICE_PROFILE));
  log("  DEVICE_PLATFORM: \t\t\t0x"+device.getInfo(cl.DEVICE_PLATFORM).toString(16));
  log("  DEVICE_OPENCL_C_VERSION: \t\t"+device.getInfo(cl.DEVICE_OPENCL_C_VERSION));
  var type=parseInt(device.getInfo(cl.DEVICE_TYPE));
  var type_strings=[];
  if( type & cl.DEVICE_TYPE_CPU )
    type_strings.push("cpu");
  if( type & cl.DEVICE_TYPE_GPU )
    type_strings.push("gpu");
  if( type & cl.DEVICE_TYPE_ACCELERATOR )
    type_strings.push("accelerator");
  if( type & cl.DEVICE_TYPE_DEFAULT )
    type_strings.push("default");
  // FIXME: 1.2
  //if( type & cl.DEVICE_TYPE_CUSTOM )
  //  type_strings.push("custom");
  log("  DEVICE_TYPE:\t\t\t"+type_strings.join(" "));

  var compute_units=0;
  log("  DEVICE_MAX_COMPUTE_UNITS:\t\t"+(compute_units=device.getInfo(cl.DEVICE_MAX_COMPUTE_UNITS)));
  log("  DEVICE_MAX_WORK_ITEM_DIMENSIONS:\t"+device.getInfo(cl.DEVICE_MAX_WORK_ITEM_DIMENSIONS));

  var workitem_sizes=device.getInfo(cl.DEVICE_MAX_WORK_ITEM_SIZES);
  log("  DEVICE_MAX_WORK_ITEM_SIZES:\t"+workitem_sizes.join(" / "));

  log("  DEVICE_MAX_WORK_GROUP_SIZE:\t"+device.getInfo(cl.DEVICE_MAX_WORK_GROUP_SIZE));
  log("  DEVICE_MAX_CLOCK_FREQUENCY:\t"+device.getInfo(cl.DEVICE_MAX_CLOCK_FREQUENCY)+" MHz");
  log("  DEVICE_ADDRESS_BITS:\t\t"+device.getInfo(cl.DEVICE_ADDRESS_BITS));
  log("  DEVICE_MAX_MEM_ALLOC_SIZE:\t\t"+(device.getInfo(cl.DEVICE_MAX_MEM_ALLOC_SIZE) / (1024 * 1024))+" MBytes");
  log("  DEVICE_GLOBAL_MEM_SIZE:\t\t"+(device.getInfo(cl.DEVICE_GLOBAL_MEM_SIZE) / (1024 * 1024))+" MBytes");
  log("  DEVICE_ERROR_CORRECTION_SUPPORT:\t"+(device.getInfo(cl.DEVICE_ERROR_CORRECTION_SUPPORT) == cl.TRUE ? "yes" : "no"));

  // DEVICE_LOCAL_MEM_TYPE
  var local_mem_type=device.getInfo(cl.DEVICE_LOCAL_MEM_TYPE);
  if( cache_type === cl.NONE )
    log("  DEVICE_LOCAL_MEM_TYPE:\t\tNONE");
  if( cache_type === cl.LOCAL )
    log("  DEVICE_LOCAL_MEM_TYPE:\t\tLOCAL");
  if( cache_type === cl.GLOBAL )
    log("  DEVICE_LOCAL_MEM_TYPE:\t\tGLOBAL");

  log("  DEVICE_LOCAL_MEM_SIZE:\t\t"+(device.getInfo(cl.DEVICE_LOCAL_MEM_SIZE) / 1024)+" KBytes");
  log("  DEVICE_MAX_CONSTANT_BUFFER_SIZE:\t"+(device.getInfo(cl.DEVICE_MAX_CONSTANT_BUFFER_SIZE) / 1024)+" KBytes");
  log("  DEVICE_MAX_CONSTANT_BUFFER_SIZE:\t"+(device.getInfo(cl.DEVICE_MAX_CONSTANT_BUFFER_SIZE) / 1024)+" KBytes");

  log("  DEVICE_MAX_SAMPLERS:\t"+device.getInfo(cl.DEVICE_MAX_SAMPLERS));
  log("  DEVICE_MAX_PARAMETER_SIZE:\t"+device.getInfo(cl.DEVICE_MAX_PARAMETER_SIZE));
  log("  DEVICE_MEM_BASE_ADDR_ALIGN:\t"+device.getInfo(cl.DEVICE_MEM_BASE_ADDR_ALIGN));
  log("  DEVICE_MIN_DATA_TYPE_ALIGN_SIZE:\t"+device.getInfo(cl.DEVICE_MIN_DATA_TYPE_ALIGN_SIZE));

  var cache_type=device.getInfo(cl.DEVICE_GLOBAL_MEM_CACHE_TYPE);
  if( cache_type === cl.NONE )
    log("  DEVICE_GLOBAL_MEM_CACHE_TYPE:\t\tNONE");
  if( cache_type === cl.READ_ONLY_CACHE )
    log("  DEVICE_GLOBAL_MEM_CACHE_TYPE:\t\tREAD_ONLY_CACHE");
  if( cache_type === cl.READ_WRITE_CACHE )
    log("  DEVICE_GLOBAL_MEM_CACHE_TYPE:\t\tREAD_WRITE_CACHE");

  log("  DEVICE_GLOBAL_MEM_CACHE_SIZE:\t\t"+(device.getInfo(cl.DEVICE_GLOBAL_MEM_CACHE_SIZE) / (1024))+" KBytes");
  log("  DEVICE_GLOBAL_MEM_CACHELINE_SIZE:\t\t"+device.getInfo(cl.DEVICE_GLOBAL_MEM_CACHELINE_SIZE)+" Bytes");
    
  log("  DEVICE_MAX_CONSTANT_ARGS:\t"+device.getInfo(cl.DEVICE_MAX_CONSTANT_ARGS));
  log("  DEVICE_HOST_UNIFIED_MEMORY:\t"+device.getInfo(cl.DEVICE_HOST_UNIFIED_MEMORY));
  log("  DEVICE_PROFILING_TIMER_RESOLUTION:\t"+device.getInfo(cl.DEVICE_PROFILING_TIMER_RESOLUTION));
  log("  DEVICE_ENDIAN_LITTLE:\t"+device.getInfo(cl.DEVICE_ENDIAN_LITTLE));

  log("  DEVICE_AVAILABLE:\t"+device.getInfo(cl.DEVICE_AVAILABLE));
  log("  DEVICE_COMPILER_AVAILABLE:\t"+device.getInfo(cl.DEVICE_COMPILER_AVAILABLE));

  // DEVICE_EXECUTION_CAPABILITIES
  var execution_capabilities=device.getInfo(cl.DEVICE_EXECUTION_CAPABILITIES);
  var execution_capabilities_strings=[];
  if( execution_capabilities & cl.EXEC_KERNEL )
    execution_capabilities_strings.push("kernel");
  if( execution_capabilities & cl.EXEC_NATIVE_KERNEL )
    execution_capabilities_strings.push("native-kernel");
  log("  DEVICE_EXECUTION_CAPABILITIES:\t\t"+execution_capabilities_strings.join(" "));

  // DEVICE_QUEUE_PROPERTIES
  var queue_properties=device.getInfo(cl.DEVICE_QUEUE_PROPERTIES);
  var queue_properties_strings=[];
  if( queue_properties & cl.QUEUE_OUT_OF_ORDER_EXEC_MODE_ENABLE )
    queue_properties_strings.push("out-of-order-exec-mode");
  if( queue_properties & cl.QUEUE_PROFILING_ENABLE )
    queue_properties_strings.push("profiling");
  log("  DEVICE_QUEUE_PROPERTIES:\t\t"+queue_properties_strings.join(" "));

  // image support
  log("  DEVICE_IMAGE_SUPPORT:\t\t"+device.getInfo(cl.DEVICE_IMAGE_SUPPORT));
  log("  DEVICE_MAX_READ_IMAGE_ARGS:\t"+device.getInfo(cl.DEVICE_MAX_READ_IMAGE_ARGS));
  log("  DEVICE_MAX_WRITE_IMAGE_ARGS:\t"+device.getInfo(cl.DEVICE_MAX_WRITE_IMAGE_ARGS));

  function fp_config_info(type, name)
  {
    // DEVICE_*_FP_CONFIG
    var fp_config=device.getInfo(type);
    var fp_config_strings=[];
    if( fp_config & cl.FP_DENORM )
      fp_config_strings.push("denorms");
    if( fp_config & cl.FP_INF_NAN )
      fp_config_strings.push("INF-quietNaNs");
    if( fp_config & cl.FP_ROUND_TO_NEAREST )
      fp_config_strings.push("round-to-nearest");
    if( fp_config & cl.FP_ROUND_TO_ZERO )
      fp_config_strings.push("round-to-zero");
    if( fp_config & cl.FP_ROUND_TO_INF )
      fp_config_strings.push("round-to-inf");
    if( fp_config & cl.FP_FMA )
      fp_config_strings.push("fma");
    if( fp_config & cl.FP_SOFT_FLOAT )
      fp_config_strings.push("soft-float");
    log("  "+name+":\t\t"+fp_config_strings.join(" "));
  };

  fp_config_info(cl.DEVICE_HALF_FP_CONFIG, "DEVICE_HALF_FP_CONFIG");
  fp_config_info(cl.DEVICE_SINGLE_FP_CONFIG, "DEVICE_SINGLE_FP_CONFIG");
  fp_config_info(cl.DEVICE_DOUBLE_FP_CONFIG, "DEVICE_DOUBLE_FP_CONFIG");

  log("\n  DEVICE_IMAGE <dim>"); 
  log("\t\t\t\t\t2D_MAX_WIDTH\t "+device.getInfo(cl.DEVICE_IMAGE2D_MAX_WIDTH));
  log("\t\t\t\t\t2D_MAX_HEIGHT\t "+device.getInfo(cl.DEVICE_IMAGE2D_MAX_HEIGHT));
  log("\t\t\t\t\t3D_MAX_WIDTH\t "+device.getInfo(cl.DEVICE_IMAGE3D_MAX_WIDTH));
  log("\t\t\t\t\t3D_MAX_HEIGHT\t "+device.getInfo(cl.DEVICE_IMAGE3D_MAX_HEIGHT));
  log("\t\t\t\t\t3D_MAX_DEPTH\t "+device.getInfo(cl.DEVICE_IMAGE3D_MAX_DEPTH));

  // DEVICE_EXTENSIONS: get device extensions, and if any then parse & log the string onto separate lines
  log("\n  DEVICE_EXTENSIONS:");
  var device_string=device.getInfo(cl.DEVICE_EXTENSIONS);
  var nv_device_attibute_query=false;
  if (device_string.length > 0) 
  {
    var extensions=device_string.trim().split(' ');
    for(var i=0;i<extensions.length;i++) {
      if("nv_device_attribute_query"===extensions[i])
        nv_device_attibute_query=true;
      log("\t\t\t\t\t"+extensions[i]);
    }
  }
  else 
    log("\t\t\t\t\tNone");

  if(nv_device_attibute_query) 
  {
    var compute_capability_major=device.getInfo(cl.DEVICE_COMPUTE_CAPABILITY_MAJOR_NV);
    var compute_capability_minor=device.getInfo(cl.DEVICE_COMPUTE_CAPABILITY_MINOR_NV);
    log("\n  DEVICE_COMPUTE_CAPABILITY_NV:\t"+compute_capability_major+'.'+compute_capability_minor);
    log("  NUMBER OF MULTIPROCESSORS:\t\t"+compute_units); // this is the same value reported by DEVICE_MAX_COMPUTE_UNITS
    log("  NUMBER OF CUDA CORES:\t\t\t"+NV_ConvertSMVer2Cores(compute_capability_major, compute_capability_minor) * compute_units);
    log("  DEVICE_REGISTERS_PER_BLOCK_NV:\t"+device.getInfo(cl.DEVICE_REGISTERS_PER_BLOCK_NV));
    log("  DEVICE_WARP_SIZE_NV:\t\t"+device.getInfo(cl.DEVICE_WARP_SIZE_NV));
    log("  DEVICE_GPU_OVERLAP_NV:\t\t"+(device.getInfo(cl.DEVICE_GPU_OVERLAP_NV) == cl.TRUE ? "TRUE" : "FALSE"));
    log("  DEVICE_KERNEL_EXEC_TIMEOUT_NV:\t"+(device.getInfo(cl.DEVICE_KERNEL_EXEC_TIMEOUT_NV) == cl.TRUE ? "TRUE" : "FALSE"));
    log("  DEVICE_INTEGRATED_MEMORY_NV:\t"+(device.getInfo(cl.DEVICE_INTEGRATED_MEMORY_NV) == cl.TRUE ? "TRUE" : "FALSE"));
  }

  // DEVICE_PREFERRED_VECTOR_WIDTH_<type>
  log("  DEVICE_PREFERRED_VECTOR_WIDTH_<t>"); 
  var vec_width= [
                  device.getInfo(cl.DEVICE_PREFERRED_VECTOR_WIDTH_CHAR),
                  device.getInfo(cl.DEVICE_PREFERRED_VECTOR_WIDTH_SHORT),
                  device.getInfo(cl.DEVICE_PREFERRED_VECTOR_WIDTH_INT),
                  device.getInfo(cl.DEVICE_PREFERRED_VECTOR_WIDTH_LONG),
                  device.getInfo(cl.DEVICE_PREFERRED_VECTOR_WIDTH_FLOAT),
                  device.getInfo(cl.DEVICE_PREFERRED_VECTOR_WIDTH_DOUBLE),
                  ];
  log('\tCHAR '+vec_width[0]+', SHORT '+vec_width[1]+', INT '+vec_width[2]+', LONG '+vec_width[3]+
      ', FLOAT '+vec_width[4]+', DOUBLE '+vec_width[5]);

  log("  DEVICE_NATIVE_VECTOR_WIDTH_<t>"); 
  var vec_native_width= [
                         device.getInfo(cl.DEVICE_NATIVE_VECTOR_WIDTH_CHAR),
                         device.getInfo(cl.DEVICE_NATIVE_VECTOR_WIDTH_SHORT),
                         device.getInfo(cl.DEVICE_NATIVE_VECTOR_WIDTH_INT),
                         device.getInfo(cl.DEVICE_NATIVE_VECTOR_WIDTH_LONG),
                         device.getInfo(cl.DEVICE_NATIVE_VECTOR_WIDTH_FLOAT),
                         device.getInfo(cl.DEVICE_NATIVE_VECTOR_WIDTH_DOUBLE),
                         ];
  log('\tCHAR '+vec_native_width[0]+', SHORT '+vec_native_width[1]+', INT '+vec_native_width[2]+
      ', LONG '+vec_native_width[3]+', FLOAT '+vec_native_width[4]+', DOUBLE '+vec_native_width[5]);
}

function NV_ConvertSMVer2Cores(major, minor)
{
  // Defines for GPU Architecture types (using the SM version to determine the # of cores per SM
  //0xMm (hexadecimal notation), M = SM Major version, and m = SM minor version
  var nGpuArchCoresPerSM = [
                            {'SM': 0x10,  'Cores': 8 },
                            { 'SM': 0x11, 'Cores': 8 },
                            { 'SM': 0x12, 'Cores': 8 },
                            { 'SM': 0x13, 'Cores': 8 },
                            { 'SM': 0x20, 'Cores': 32 },
                            { 'SM': 0x21, 'Cores': 48 },
                            { 'SM':   -1, 'Cores': -1 }
                            ];

  var index = 0;
  while (nGpuArchCoresPerSM[index].SM != -1) {
    if (nGpuArchCoresPerSM[index].SM == ((major << 4) + minor) ) {
      return nGpuArchCoresPerSM[index].Cores;
    }
    index++;
  }
  log("MapSMtoCores undefined SMversion "+major+'.'+minor);
  return -1;
}

//Helper function to get OpenCL image format string (channel order and type) from constant
//*********************************************************************
function oclImageFormatString(uiImageFormat)
{
 // channel_order 
 if (uiImageFormat == cl.R)return "R";  
 if (uiImageFormat == cl.A)return "A";  
 if (uiImageFormat == cl.RG)return "RG";  
 if (uiImageFormat == cl.RA)return "RA";  
 if (uiImageFormat == cl.RGB)return "RGB";
 if (uiImageFormat == cl.RGBA)return "RGBA";  
 if (uiImageFormat == cl.BGRA)return "BGRA";  
 if (uiImageFormat == cl.ARGB)return "ARGB";  
 if (uiImageFormat == cl.INTENSITY)return "INTENSITY";  
 if (uiImageFormat == cl.LUMINANCE)return "LUMINANCE";  

 // channel_type 
 if (uiImageFormat == cl.SNORM_INT8)return "SNORM_INT8";
 if (uiImageFormat == cl.SNORM_INT16)return "SNORM_INT16";
 if (uiImageFormat == cl.UNORM_INT8)return "UNORM_INT8";
 if (uiImageFormat == cl.UNORM_INT16)return "UNORM_INT16";
 if (uiImageFormat == cl.UNORM_SHORT_565)return "UNORM_SHORT_565";
 if (uiImageFormat == cl.UNORM_SHORT_555)return "UNORM_SHORT_555";
 if (uiImageFormat == cl.UNORM_INT_101010)return "UNORM_INT_101010";
 if (uiImageFormat == cl.SIGNED_INT8)return "SIGNED_INT8";
 if (uiImageFormat == cl.SIGNED_INT16)return "SIGNED_INT16";
 if (uiImageFormat == cl.SIGNED_INT32)return "SIGNED_INT32";
 if (uiImageFormat == cl.UNSIGNED_INT8)return "UNSIGNED_INT8";
 if (uiImageFormat == cl.UNSIGNED_INT16)return "UNSIGNED_INT16";
 if (uiImageFormat == cl.UNSIGNED_INT32)return "UNSIGNED_INT32";
 if (uiImageFormat == cl.HALF_FLOAT)return "HALF_FLOAT";
 if (uiImageFormat == cl.FLOAT)return "FLOAT";

 // unknown constant
 return "Unknown";
}
