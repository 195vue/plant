const fs=require("fs");
const mkU=(k,t,cd,ct,ch)=>({key:k,title:t,code:cd,type:"usage",count:ct,children:ch});
const mkS=(k,t,cd,ct,ch)=>({key:k,title:t,code:cd,type:"system",count:ct,children:ch});
const mkP=(k,t,cd,ct)=>({key:k,title:t,code:cd,type:"position",count:ct});
const mkE=(k,t,cd,ct,ch)=>({key:k,title:t,code:cd,type:"equipment",count:ct,children:ch});
const mkEL=(k,t,cd,ct)=>({key:k,title:t,code:cd,type:"equipment",count:ct});
const c=(k,t,cd)=>({key:k,title:t,code:cd,type:"component"});
const t1=[
mkS("cate-1","辅机管网系统","CATE-001",156,[
  mkS("sys-1-1","技术供水系统","SYS-001",45,[
    mkU("use-1-1-1","主管路","USE-001",12,[c("comp-1","1#机组技术供水主管","PL-001"),c("comp-2","2#机组技术供水主管","PL-002"),c("comp-3","技术供水总阀","VL-001")]),
    mkU("use-1-1-2","分支管路","USE-002",18,[c("comp-4","1#机组分支管","PL-010"),c("comp-5","2#机组分支管","PL-011")]),
    mkU("use-1-1-3","设备连接管","USE-003",15,[c("comp-6","1#水泵连接管","PL-020")])
  ])
])
];
console.log("test:", t1.length, t1[0].title);
