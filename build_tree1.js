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
  ]),
  mkS("sys-1-2","排水系统","SYS-002",28,[
    mkU("use-1-2-1","主管路","USE-004",8,[c("comp-7","厂房排水主管","PL-003")]),
    mkU("use-1-2-2","分支管路","USE-005",20,[c("comp-7-1","厂房排水分支管","PL-030")])
  ]),
  mkS("sys-1-3","气系统","SYS-003",35,[
    mkU("use-1-3-1","高压气系统","USE-006",15,[c("comp-8","高压气系统主管","PL-005")]),
    mkU("use-1-3-2","低压气系统","USE-007",20,[c("comp-9","低压气系统主管","PL-004")])
  ]),
  mkS("sys-1-4","透平油系统","SYS-004",22,[
    mkU("use-1-4-1","供油系统","USE-008",12,[c("comp-10","透平油供油主管","PL-006")]),
    mkU("use-1-4-2","排油系统","USE-009",10,[c("comp-10-1","透平油排油管","PL-031")])
  ]),
  mkS("sys-1-5","消防水系统","SYS-005",26,[
    mkU("use-1-5-1","主管路","USE-010",10,[c("comp-11","消防水主管","PL-007"),c("comp-12","厂区消防主管","PL-008")]),
    mkU("use-1-5-2","分支管路","USE-011",16,[c("comp-12-1","厂房消防分支管","PL-032")])
  ])
]),
{key:"cate-2",title:"厂房结构",code:"CATE-002",type:"position",count:86,children:[
  mkP("pos-2-1","主变室","POS-001",12),mkP("pos-2-2","主厂房","POS-002",28),
  mkP("pos-2-3","副厂房","POS-003",18),mkP("pos-2-4","安装间","POS-004",10),
  mkP("pos-2-5","进厂交通洞","POS-005",8),mkP("pos-2-6","顶部出线平台","POS-006",10)
]},
mkE("cate-3","机电设备","CATE-003",162,[
  mkE("eqcat-3-1","水轮机及附属部件","EQ-TUR",32,[mkEL("eq-3-1-1","1#水轮机","EQ-001",8),mkEL("eq-3-1-2","2#水轮机","EQ-002",8),mkEL("eq-3-1-3","3#水轮机","EQ-003",8),mkEL("eq-3-1-4","4#水轮机","EQ-004",8)]),
  mkE("eqcat-3-2","发电机及附属部件","EQ-GEN",28,[mkEL("eq-3-2-1","1#发电机","EQ-005",7),mkEL("eq-3-2-2","2#发电机","EQ-006",7),mkEL("eq-3-2-3","3#发电机","EQ-007",7),mkEL("eq-3-2-4","4#发电机","EQ-008",7)]),
  mkE("eqcat-3-3","调速器及油压装置","EQ-GOV",16,[mkEL("eq-3-3-1","1#调速器","EQ-009",4),mkEL("eq-3-3-2","2#调速器","EQ-010",4),mkEL("eq-3-3-3","3#调速器","EQ-011",4),mkEL("eq-3-3-4","4#调速器","EQ-012",4)]),
  mkE("eqcat-3-4","主变压器","EQ-TXF",12,[mkEL("eq-3-4-1","1#主变压器","EQ-013",3),mkEL("eq-3-4-2","2#主变压器","EQ-014",3),mkEL("eq-3-4-3","3#主变压器","EQ-015",3),mkEL("eq-3-4-4","4#主变压器","EQ-016",3)]),
  mkE("eqcat-3-5","励磁系统","EQ-EXC",12,[mkEL("eq-3-5-1","1#励磁系统","EQ-017",3),mkEL("eq-3-5-2","2#励磁系统","EQ-018",3),mkEL("eq-3-5-3","3#励磁系统","EQ-019",3),mkEL("eq-3-5-4","4#励磁系统","EQ-020",3)]),
  mkE("eqcat-3-6","主厂房桥机","EQ-CRAN",4,[mkEL("eq-3-6-1","1#桥机","EQ-021",2),mkEL("eq-3-6-2","2#桥机","EQ-022",2)]),
  mkE("eqcat-3-7","发电机电压设备","EQ-GVE",16,[mkEL("eq-3-7-1","1#发电机电压设备","EQ-023",4),mkEL("eq-3-7-2","2#发电机电压设备","EQ-024",4),mkEL("eq-3-7-3","3#发电机电压设备","EQ-025",4),mkEL("eq-3-7-4","4#发电机电压设备","EQ-026",4)]),
  mkE("eqcat-3-8","厂用电各设备","EQ-SFE",18,[mkEL("eq-3-8-1","1#厂用变压器","EQ-027",6),mkEL("eq-3-8-2","2#厂用变压器","EQ-028",6),mkEL("eq-3-8-3","3#厂用变压器","EQ-029",6)]),
  mkE("eqcat-3-9","全厂控制盘柜","EQ-CTR",14,[mkEL("eq-3-9-1","中控室控制台","EQ-030",4),mkEL("eq-3-9-2","保护屏柜","EQ-031",6),mkEL("eq-3-9-3","直流盘柜","EQ-032",4)]),
  mkE("eqcat-3-10","蓄电池","EQ-BAT",6,[mkEL("eq-3-10-1","1#蓄电池组","EQ-033",3),mkEL("eq-3-10-2","2#蓄电池组","EQ-034",3)]),
  mkE("eqcat-3-11","空调设备","EQ-AIR",8,[mkEL("eq-3-11-1","1#空调机组","EQ-035",2),mkEL("eq-3-11-2","2#空调机组","EQ-036",2),mkEL("eq-3-11-3","3#空调机组","EQ-037",2),mkEL("eq-3-11-4","4#空调机组","EQ-038",2)]),
  {key:"eqcat-3-12",title:"空调系统管路",code:"EQ-AIRP",type:"component",count:8,children:[{key:"eq-3-12-1",title:"空调送风主管",code:"PL-033",type:"component",count:4},{key:"eq-3-12-2",title:"空调回风主管",code:"PL-034",type:"component",count:4}]},
  mkE("eqcat-3-13","闸门及启闭机","EQ-GATE",12,[mkEL("eq-3-13-1","进水口闸门","EQ-039",3),mkEL("eq-3-13-2","尾水闸门","EQ-040",3),mkEL("eq-3-13-3","溢洪道闸门","EQ-041",3),mkEL("eq-3-13-4","泄洪洞闸门","EQ-042",3)])
]},
{key:"cate-4",title:"大坝",code:"CATE-004",type:"position",count:48,children:[
  mkP("pos-4-1","坝体","POS-DM-001",12),mkP("pos-4-2","左岸溢洪道","POS-DM-002",8),
  mkP("pos-4-3","右岸溢洪道","POS-DM-003",8),mkP("pos-4-4","左岸泄洪洞","POS-DM-004",8),
  mkP("pos-4-5","泄洪中孔","POS-DM-005",6),mkP("pos-4-6","坝顶启闭机房","POS-DM-006",6)
]}
];
fs.writeFileSync("c:/Users/云/Documents/trae_projects/aicaotu/src/mock/tree1.json",JSON.stringify(t1));
console.log("tree1 saved");
