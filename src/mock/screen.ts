import type { TreeNodeData } from "@/components/common/TreePanel";

// 工程总览结构树（按BIM建模范围表5.3-1分类）
export const overviewTreeData: TreeNodeData[] = [
  {
    "key": "cate-1",
    "title": "辅机管网系统",
    "code": "CATE-001",
    "type": "system",
    "count": 156,
    "children": [
      {
        "key": "sys-1-1",
        "title": "技术供水系统",
        "code": "SYS-001",
        "type": "system",
        "count": 45,
        "children": [
          {
            "key": "use-1-1-1",
            "title": "主管路",
            "code": "USE-001",
            "type": "usage",
            "count": 12,
            "children": [
              {
                "key": "comp-1",
                "title": "1#机组技术供水主管",
                "code": "PL-001",
                "type": "component"
              },
              {
                "key": "comp-2",
                "title": "2#机组技术供水主管",
                "code": "PL-002",
                "type": "component"
              },
              {
                "key": "comp-3",
                "title": "技术供水总阀",
                "code": "VL-001",
                "type": "component"
              }
            ]
          },
          {
            "key": "use-1-1-2",
            "title": "分支管路",
            "code": "USE-002",
            "type": "usage",
            "count": 18,
            "children": [
              {
                "key": "comp-4",
                "title": "1#机组分支管",
                "code": "PL-010",
                "type": "component"
              },
              {
                "key": "comp-5",
                "title": "2#机组分支管",
                "code": "PL-011",
                "type": "component"
              }
            ]
          },
          {
            "key": "use-1-1-3",
            "title": "设备连接管",
            "code": "USE-003",
            "type": "usage",
            "count": 15,
            "children": [
              {
                "key": "comp-6",
                "title": "1#水泵连接管",
                "code": "PL-020",
                "type": "component"
              }
            ]
          }
        ]
      },
      {
        "key": "sys-1-2",
        "title": "排水系统",
        "code": "SYS-002",
        "type": "system",
        "count": 28,
        "children": [
          {
            "key": "use-1-2-1",
            "title": "主管路",
            "code": "USE-004",
            "type": "usage",
            "count": 8,
            "children": [
              {
                "key": "comp-7",
                "title": "厂房排水主管",
                "code": "PL-003",
                "type": "component"
              }
            ]
          },
          {
            "key": "use-1-2-2",
            "title": "分支管路",
            "code": "USE-005",
            "type": "usage",
            "count": 20,
            "children": [
              {
                "key": "comp-7-1",
                "title": "厂房排水分支管",
                "code": "PL-030",
                "type": "component"
              }
            ]
          }
        ]
      },
      {
        "key": "sys-1-3",
        "title": "气系统",
        "code": "SYS-003",
        "type": "system",
        "count": 35,
        "children": [
          {
            "key": "use-1-3-1",
            "title": "高压气系统",
            "code": "USE-006",
            "type": "usage",
            "count": 15,
            "children": [
              {
                "key": "comp-8",
                "title": "高压气系统主管",
                "code": "PL-005",
                "type": "component"
              }
            ]
          },
          {
            "key": "use-1-3-2",
            "title": "低压气系统",
            "code": "USE-007",
            "type": "usage",
            "count": 20,
            "children": [
              {
                "key": "comp-9",
                "title": "低压气系统主管",
                "code": "PL-004",
                "type": "component"
              }
            ]
          }
        ]
      },
      {
        "key": "sys-1-4",
        "title": "透平油系统",
        "code": "SYS-004",
        "type": "system",
        "count": 22,
        "children": [
          {
            "key": "use-1-4-1",
            "title": "供油系统",
            "code": "USE-008",
            "type": "usage",
            "count": 12,
            "children": [
              {
                "key": "comp-10",
                "title": "透平油供油主管",
                "code": "PL-006",
                "type": "component"
              }
            ]
          },
          {
            "key": "use-1-4-2",
            "title": "排油系统",
            "code": "USE-009",
            "type": "usage",
            "count": 10,
            "children": [
              {
                "key": "comp-10-1",
                "title": "透平油排油管",
                "code": "PL-031",
                "type": "component"
              }
            ]
          }
        ]
      },
      {
        "key": "sys-1-5",
        "title": "消防水系统",
        "code": "SYS-005",
        "type": "system",
        "count": 26,
        "children": [
          {
            "key": "use-1-5-1",
            "title": "主管路",
            "code": "USE-010",
            "type": "usage",
            "count": 10,
            "children": [
              {
                "key": "comp-11",
                "title": "消防水主管",
                "code": "PL-007",
                "type": "component"
              },
              {
                "key": "comp-12",
                "title": "厂区消防主管",
                "code": "PL-008",
                "type": "component"
              }
            ]
          },
          {
            "key": "use-1-5-2",
            "title": "分支管路",
            "code": "USE-011",
            "type": "usage",
            "count": 16,
            "children": [
              {
                "key": "comp-12-1",
                "title": "厂房消防分支管",
                "code": "PL-032",
                "type": "component"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "key": "cate-2",
    "title": "厂房结构",
    "code": "CATE-002",
    "type": "position",
    "count": 86,
    "children": [
      {
        "key": "pos-2-1",
        "title": "主变室",
        "code": "POS-001",
        "type": "position",
        "count": 12
      },
      {
        "key": "pos-2-2",
        "title": "主厂房",
        "code": "POS-002",
        "type": "position",
        "count": 28
      },
      {
        "key": "pos-2-3",
        "title": "副厂房",
        "code": "POS-003",
        "type": "position",
        "count": 18
      },
      {
        "key": "pos-2-4",
        "title": "安装间",
        "code": "POS-004",
        "type": "position",
        "count": 10
      },
      {
        "key": "pos-2-5",
        "title": "进厂交通洞",
        "code": "POS-005",
        "type": "position",
        "count": 8
      },
      {
        "key": "pos-2-6",
        "title": "顶部出线平台",
        "code": "POS-006",
        "type": "position",
        "count": 10
      }
    ]
  },
  {
    "key": "cate-3",
    "title": "机电设备",
    "code": "CATE-003",
    "type": "equipment",
    "count": 162,
    "children": [
      {
        "key": "eqcat-3-1",
        "title": "水轮机及附属部件",
        "code": "EQ-TUR",
        "type": "equipment",
        "count": 32,
        "children": [
          {
            "key": "eq-3-1-1",
            "title": "1#水泵水轮机",
            "code": "EQ-001",
            "type": "equipment",
            "count": 8
          },
          {
            "key": "eq-3-1-2",
            "title": "2#水泵水轮机",
            "code": "EQ-002",
            "type": "equipment",
            "count": 8
          },
          {
            "key": "eq-3-1-3",
            "title": "3#水泵水轮机",
            "code": "EQ-003",
            "type": "equipment",
            "count": 8
          },
          {
            "key": "eq-3-1-4",
            "title": "4#水泵水轮机",
            "code": "EQ-004",
            "type": "equipment",
            "count": 8
          }
        ]
      },
      {
        "key": "eqcat-3-2",
        "title": "发电机及附属部件",
        "code": "EQ-GEN",
        "type": "equipment",
        "count": 28,
        "children": [
          {
            "key": "eq-3-2-1",
            "title": "1#发电电动机",
            "code": "EQ-005",
            "type": "equipment",
            "count": 7
          },
          {
            "key": "eq-3-2-2",
            "title": "2#发电电动机",
            "code": "EQ-006",
            "type": "equipment",
            "count": 7
          },
          {
            "key": "eq-3-2-3",
            "title": "3#发电电动机",
            "code": "EQ-007",
            "type": "equipment",
            "count": 7
          },
          {
            "key": "eq-3-2-4",
            "title": "4#发电电动机",
            "code": "EQ-008",
            "type": "equipment",
            "count": 7
          }
        ]
      },
      {
        "key": "eqcat-3-3",
        "title": "调速器及油压装置",
        "code": "EQ-GOV",
        "type": "equipment",
        "count": 16,
        "children": [
          {
            "key": "eq-3-3-1",
            "title": "1#调速器",
            "code": "EQ-009",
            "type": "equipment",
            "count": 4
          },
          {
            "key": "eq-3-3-2",
            "title": "2#调速器",
            "code": "EQ-010",
            "type": "equipment",
            "count": 4
          },
          {
            "key": "eq-3-3-3",
            "title": "3#调速器",
            "code": "EQ-011",
            "type": "equipment",
            "count": 4
          },
          {
            "key": "eq-3-3-4",
            "title": "4#调速器",
            "code": "EQ-012",
            "type": "equipment",
            "count": 4
          }
        ]
      },
      {
        "key": "eqcat-3-4",
        "title": "主变压器",
        "code": "EQ-TXF",
        "type": "equipment",
        "count": 12,
        "children": [
          {
            "key": "eq-3-4-1",
            "title": "1#主变压器",
            "code": "EQ-013",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-4-2",
            "title": "2#主变压器",
            "code": "EQ-014",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-4-3",
            "title": "3#主变压器",
            "code": "EQ-015",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-4-4",
            "title": "4#主变压器",
            "code": "EQ-016",
            "type": "equipment",
            "count": 3
          }
        ]
      },
      {
        "key": "eqcat-3-5",
        "title": "励磁系统",
        "code": "EQ-EXC",
        "type": "equipment",
        "count": 12,
        "children": [
          {
            "key": "eq-3-5-1",
            "title": "1#励磁系统",
            "code": "EQ-017",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-5-2",
            "title": "2#励磁系统",
            "code": "EQ-018",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-5-3",
            "title": "3#励磁系统",
            "code": "EQ-019",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-5-4",
            "title": "4#励磁系统",
            "code": "EQ-020",
            "type": "equipment",
            "count": 3
          }
        ]
      },
      {
        "key": "eqcat-3-6",
        "title": "主厂房桥机",
        "code": "EQ-CRAN",
        "type": "equipment",
        "count": 4,
        "children": [
          {
            "key": "eq-3-6-1",
            "title": "1#桥机",
            "code": "EQ-021",
            "type": "equipment",
            "count": 2
          },
          {
            "key": "eq-3-6-2",
            "title": "2#桥机",
            "code": "EQ-022",
            "type": "equipment",
            "count": 2
          }
        ]
      },
      {
        "key": "eqcat-3-7",
        "title": "发电机电压设备",
        "code": "EQ-GVE",
        "type": "equipment",
        "count": 16,
        "children": [
          {
            "key": "eq-3-7-1",
            "title": "1#发电机电压设备",
            "code": "EQ-023",
            "type": "equipment",
            "count": 4
          },
          {
            "key": "eq-3-7-2",
            "title": "2#发电机电压设备",
            "code": "EQ-024",
            "type": "equipment",
            "count": 4
          },
          {
            "key": "eq-3-7-3",
            "title": "3#发电机电压设备",
            "code": "EQ-025",
            "type": "equipment",
            "count": 4
          },
          {
            "key": "eq-3-7-4",
            "title": "4#发电机电压设备",
            "code": "EQ-026",
            "type": "equipment",
            "count": 4
          }
        ]
      },
      {
        "key": "eqcat-3-8",
        "title": "厂用电各设备",
        "code": "EQ-SFE",
        "type": "equipment",
        "count": 18,
        "children": [
          {
            "key": "eq-3-8-1",
            "title": "1#厂用变压器",
            "code": "EQ-027",
            "type": "equipment",
            "count": 6
          },
          {
            "key": "eq-3-8-2",
            "title": "2#厂用变压器",
            "code": "EQ-028",
            "type": "equipment",
            "count": 6
          },
          {
            "key": "eq-3-8-3",
            "title": "3#厂用变压器",
            "code": "EQ-029",
            "type": "equipment",
            "count": 6
          }
        ]
      },
      {
        "key": "eqcat-3-9",
        "title": "全厂控制盘柜",
        "code": "EQ-CTR",
        "type": "equipment",
        "count": 14,
        "children": [
          {
            "key": "eq-3-9-1",
            "title": "中控室控制台",
            "code": "EQ-030",
            "type": "equipment",
            "count": 4
          },
          {
            "key": "eq-3-9-2",
            "title": "保护屏柜",
            "code": "EQ-031",
            "type": "equipment",
            "count": 6
          },
          {
            "key": "eq-3-9-3",
            "title": "直流盘柜",
            "code": "EQ-032",
            "type": "equipment",
            "count": 4
          }
        ]
      },
      {
        "key": "eqcat-3-10",
        "title": "蓄电池",
        "code": "EQ-BAT",
        "type": "equipment",
        "count": 6,
        "children": [
          {
            "key": "eq-3-10-1",
            "title": "1#蓄电池组",
            "code": "EQ-033",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-10-2",
            "title": "2#蓄电池组",
            "code": "EQ-034",
            "type": "equipment",
            "count": 3
          }
        ]
      },
      {
        "key": "eqcat-3-11",
        "title": "空调设备",
        "code": "EQ-AIR",
        "type": "equipment",
        "count": 8,
        "children": [
          {
            "key": "eq-3-11-1",
            "title": "1#空调机组",
            "code": "EQ-035",
            "type": "equipment",
            "count": 2
          },
          {
            "key": "eq-3-11-2",
            "title": "2#空调机组",
            "code": "EQ-036",
            "type": "equipment",
            "count": 2
          },
          {
            "key": "eq-3-11-3",
            "title": "3#空调机组",
            "code": "EQ-037",
            "type": "equipment",
            "count": 2
          },
          {
            "key": "eq-3-11-4",
            "title": "4#空调机组",
            "code": "EQ-038",
            "type": "equipment",
            "count": 2
          }
        ]
      },
      {
        "key": "eqcat-3-12",
        "title": "空调系统管路",
        "code": "EQ-AIRP",
        "type": "component",
        "count": 8,
        "children": [
          {
            "key": "eq-3-12-1",
            "title": "空调送风主管",
            "code": "PL-033",
            "type": "component",
            "count": 4
          },
          {
            "key": "eq-3-12-2",
            "title": "空调回风主管",
            "code": "PL-034",
            "type": "component",
            "count": 4
          }
        ]
      },
      {
        "key": "eqcat-3-13",
        "title": "闸门及启闭机",
        "code": "EQ-GATE",
        "type": "equipment",
        "count": 12,
        "children": [
          {
            "key": "eq-3-13-1",
            "title": "进水口闸门",
            "code": "EQ-039",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-13-2",
            "title": "尾水闸门",
            "code": "EQ-040",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-13-3",
            "title": "溢洪道闸门",
            "code": "EQ-041",
            "type": "equipment",
            "count": 3
          },
          {
            "key": "eq-3-13-4",
            "title": "泄洪洞闸门",
            "code": "EQ-042",
            "type": "equipment",
            "count": 3
          }
        ]
      }
    ]
  },
  {
    "key": "cate-4",
    "title": "大坝",
    "code": "CATE-004",
    "type": "position",
    "count": 48,
    "children": [
      {
        "key": "pos-4-1",
        "title": "坝体",
        "code": "POS-DM-001",
        "type": "position",
        "count": 12
      },
      {
        "key": "pos-4-2",
        "title": "左岸溢洪道",
        "code": "POS-DM-002",
        "type": "position",
        "count": 8
      },
      {
        "key": "pos-4-3",
        "title": "右岸溢洪道",
        "code": "POS-DM-003",
        "type": "position",
        "count": 8
      },
      {
        "key": "pos-4-4",
        "title": "左岸泄洪洞",
        "code": "POS-DM-004",
        "type": "position",
        "count": 8
      },
      {
        "key": "pos-4-5",
        "title": "泄洪中孔",
        "code": "POS-DM-005",
        "type": "position",
        "count": 6
      },
      {
        "key": "pos-4-6",
        "title": "坝顶启闭机房",
        "code": "POS-DM-006",
        "type": "position",
        "count": 6
      }
    ]
  }
];

// 设备总览结构树（按设备类型分类）
export const equipmentTreeData: TreeNodeData[] = [
  {
    "key": "eqgrp-1",
    "title": "水轮机",
    "code": "EQ-TUR-GRP",
    "type": "equipment",
    "count": 32,
    "children": [
      {
        "key": "eq-tur-1",
        "title": "1#水泵水轮机",
        "code": "EQ-001",
        "type": "equipment",
        "count": 8
      },
      {
        "key": "eq-tur-2",
        "title": "2#水泵水轮机",
        "code": "EQ-002",
        "type": "equipment",
        "count": 8
      },
      {
        "key": "eq-tur-3",
        "title": "3#水泵水轮机",
        "code": "EQ-003",
        "type": "equipment",
        "count": 8
      },
      {
        "key": "eq-tur-4",
        "title": "4#水泵水轮机",
        "code": "EQ-004",
        "type": "equipment",
        "count": 8
      }
    ]
  },
  {
    "key": "eqgrp-2",
    "title": "发电机",
    "code": "EQ-GEN-GRP",
    "type": "equipment",
    "count": 28,
    "children": [
      {
        "key": "eq-gen-1",
        "title": "1#发电电动机",
        "code": "EQ-005",
        "type": "equipment",
        "count": 7
      },
      {
        "key": "eq-gen-2",
        "title": "2#发电电动机",
        "code": "EQ-006",
        "type": "equipment",
        "count": 7
      },
      {
        "key": "eq-gen-3",
        "title": "3#发电电动机",
        "code": "EQ-007",
        "type": "equipment",
        "count": 7
      },
      {
        "key": "eq-gen-4",
        "title": "4#发电电动机",
        "code": "EQ-008",
        "type": "equipment",
        "count": 7
      }
    ]
  },
  {
    "key": "eqgrp-3",
    "title": "主变压器",
    "code": "EQ-TXF-GRP",
    "type": "equipment",
    "count": 12,
    "children": [
      {
        "key": "eq-txf-1",
        "title": "1#主变压器",
        "code": "EQ-013",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-txf-2",
        "title": "2#主变压器",
        "code": "EQ-014",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-txf-3",
        "title": "3#主变压器",
        "code": "EQ-015",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-txf-4",
        "title": "4#主变压器",
        "code": "EQ-016",
        "type": "equipment",
        "count": 3
      }
    ]
  },
  {
    "key": "eqgrp-4",
    "title": "调速器",
    "code": "EQ-GOV-GRP",
    "type": "equipment",
    "count": 16,
    "children": [
      {
        "key": "eq-gov-1",
        "title": "1#调速器",
        "code": "EQ-009",
        "type": "equipment",
        "count": 4
      },
      {
        "key": "eq-gov-2",
        "title": "2#调速器",
        "code": "EQ-010",
        "type": "equipment",
        "count": 4
      },
      {
        "key": "eq-gov-3",
        "title": "3#调速器",
        "code": "EQ-011",
        "type": "equipment",
        "count": 4
      },
      {
        "key": "eq-gov-4",
        "title": "4#调速器",
        "code": "EQ-012",
        "type": "equipment",
        "count": 4
      }
    ]
  },
  {
    "key": "eqgrp-5",
    "title": "励磁系统",
    "code": "EQ-EXC-GRP",
    "type": "equipment",
    "count": 12,
    "children": [
      {
        "key": "eq-exc-1",
        "title": "1#励磁系统",
        "code": "EQ-017",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-exc-2",
        "title": "2#励磁系统",
        "code": "EQ-018",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-exc-3",
        "title": "3#励磁系统",
        "code": "EQ-019",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-exc-4",
        "title": "4#励磁系统",
        "code": "EQ-020",
        "type": "equipment",
        "count": 3
      }
    ]
  },
  {
    "key": "eqgrp-6",
    "title": "主厂房桥机",
    "code": "EQ-CRAN-GRP",
    "type": "equipment",
    "count": 4,
    "children": [
      {
        "key": "eq-cran-1",
        "title": "1#桥机",
        "code": "EQ-021",
        "type": "equipment",
        "count": 2
      },
      {
        "key": "eq-cran-2",
        "title": "2#桥机",
        "code": "EQ-022",
        "type": "equipment",
        "count": 2
      }
    ]
  },
  {
    "key": "eqgrp-7",
    "title": "发电机电压设备",
    "code": "EQ-GVE-GRP",
    "type": "equipment",
    "count": 16,
    "children": [
      {
        "key": "eq-gve-1",
        "title": "1#发电机电压设备",
        "code": "EQ-023",
        "type": "equipment",
        "count": 4
      },
      {
        "key": "eq-gve-2",
        "title": "2#发电机电压设备",
        "code": "EQ-024",
        "type": "equipment",
        "count": 4
      },
      {
        "key": "eq-gve-3",
        "title": "3#发电机电压设备",
        "code": "EQ-025",
        "type": "equipment",
        "count": 4
      },
      {
        "key": "eq-gve-4",
        "title": "4#发电机电压设备",
        "code": "EQ-026",
        "type": "equipment",
        "count": 4
      }
    ]
  },
  {
    "key": "eqgrp-8",
    "title": "厂用电设备",
    "code": "EQ-SFE-GRP",
    "type": "equipment",
    "count": 18,
    "children": [
      {
        "key": "eq-sfe-1",
        "title": "1#厂用变压器",
        "code": "EQ-027",
        "type": "equipment",
        "count": 6
      },
      {
        "key": "eq-sfe-2",
        "title": "2#厂用变压器",
        "code": "EQ-028",
        "type": "equipment",
        "count": 6
      },
      {
        "key": "eq-sfe-3",
        "title": "3#厂用变压器",
        "code": "EQ-029",
        "type": "equipment",
        "count": 6
      }
    ]
  },
  {
    "key": "eqgrp-9",
    "title": "控制盘柜",
    "code": "EQ-CTR-GRP",
    "type": "equipment",
    "count": 14,
    "children": [
      {
        "key": "eq-ctr-1",
        "title": "中控室控制台",
        "code": "EQ-030",
        "type": "equipment",
        "count": 4
      },
      {
        "key": "eq-ctr-2",
        "title": "保护屏柜",
        "code": "EQ-031",
        "type": "equipment",
        "count": 6
      },
      {
        "key": "eq-ctr-3",
        "title": "直流盘柜",
        "code": "EQ-032",
        "type": "equipment",
        "count": 4
      }
    ]
  },
  {
    "key": "eqgrp-10",
    "title": "蓄电池",
    "code": "EQ-BAT-GRP",
    "type": "equipment",
    "count": 6,
    "children": [
      {
        "key": "eq-bat-1",
        "title": "1#蓄电池组",
        "code": "EQ-033",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-bat-2",
        "title": "2#蓄电池组",
        "code": "EQ-034",
        "type": "equipment",
        "count": 3
      }
    ]
  },
  {
    "key": "eqgrp-11",
    "title": "空调设备",
    "code": "EQ-AIR-GRP",
    "type": "equipment",
    "count": 8,
    "children": [
      {
        "key": "eq-air-1",
        "title": "1#空调机组",
        "code": "EQ-035",
        "type": "equipment",
        "count": 2
      },
      {
        "key": "eq-air-2",
        "title": "2#空调机组",
        "code": "EQ-036",
        "type": "equipment",
        "count": 2
      },
      {
        "key": "eq-air-3",
        "title": "3#空调机组",
        "code": "EQ-037",
        "type": "equipment",
        "count": 2
      },
      {
        "key": "eq-air-4",
        "title": "4#空调机组",
        "code": "EQ-038",
        "type": "equipment",
        "count": 2
      }
    ]
  },
  {
    "key": "eqgrp-12",
    "title": "闸门启闭机",
    "code": "EQ-GATE-GRP",
    "type": "equipment",
    "count": 12,
    "children": [
      {
        "key": "eq-gate-1",
        "title": "进水口闸门",
        "code": "EQ-039",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-gate-2",
        "title": "尾水闸门",
        "code": "EQ-040",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-gate-3",
        "title": "溢洪道闸门",
        "code": "EQ-041",
        "type": "equipment",
        "count": 3
      },
      {
        "key": "eq-gate-4",
        "title": "泄洪洞闸门",
        "code": "EQ-042",
        "type": "equipment",
        "count": 3
      }
    ]
  }
];

// 管路总览结构树（按系统分类）
export const pipelineTreeData: TreeNodeData[] = [
  {
    key: "pipesys-1",
    title: "技术供水系统",
    code: "PIPE-SYS-001",
    type: "system",
    count: 45,
    children: [
      {
        key: "pipe-1-1",
        title: "主管路",
        code: "PIPE-001",
        type: "usage",
        count: 12,
        children: [
          { key: "pipe-comp-1", title: "1#机组技术供水主管", code: "PL-001", type: "component" },
          { key: "pipe-comp-2", title: "2#机组技术供水主管", code: "PL-002", type: "component" },
          { key: "pipe-comp-3", title: "技术供水总阀", code: "VL-001", type: "component" },
        ],
      },
      {
        key: "pipe-1-2",
        title: "分支管路",
        code: "PIPE-002",
        type: "usage",
        count: 18,
        children: [
          { key: "pipe-comp-4", title: "1#机组分支管", code: "PL-010", type: "component" },
          { key: "pipe-comp-5", title: "2#机组分支管", code: "PL-011", type: "component" },
        ],
      },
      {
        key: "pipe-1-3",
        title: "设备连接管",
        code: "PIPE-003",
        type: "usage",
        count: 15,
        children: [
          { key: "pipe-comp-6", title: "1#水泵连接管", code: "PL-020", type: "component" },
        ],
      },
    ],
  },
  {
    key: "pipesys-2",
    title: "排水系统",
    code: "PIPE-SYS-002",
    type: "system",
    count: 28,
    children: [
      {
        key: "pipe-2-1",
        title: "主管路",
        code: "PIPE-004",
        type: "usage",
        count: 8,
        children: [
          { key: "pipe-comp-7", title: "厂房排水主管", code: "PL-003", type: "component" },
        ],
      },
      {
        key: "pipe-2-2",
        title: "分支管路",
        code: "PIPE-005",
        type: "usage",
        count: 20,
        children: [
          { key: "pipe-comp-7-1", title: "厂房排水分支管", code: "PL-030", type: "component" },
        ],
      },
    ],
  },
  {
    key: "pipesys-3",
    title: "气系统",
    code: "PIPE-SYS-003",
    type: "system",
    count: 35,
    children: [
      {
        key: "pipe-3-1",
        title: "高压气系统",
        code: "PIPE-006",
        type: "usage",
        count: 15,
        children: [
          { key: "pipe-comp-8", title: "高压气系统主管", code: "PL-005", type: "component" },
        ],
      },
      {
        key: "pipe-3-2",
        title: "低压气系统",
        code: "PIPE-007",
        type: "usage",
        count: 20,
        children: [
          { key: "pipe-comp-9", title: "低压气系统主管", code: "PL-004", type: "component" },
        ],
      },
    ],
  },
  {
    key: "pipesys-4",
    title: "透平油系统",
    code: "PIPE-SYS-004",
    type: "system",
    count: 22,
    children: [
      {
        key: "pipe-4-1",
        title: "供油系统",
        code: "PIPE-008",
        type: "usage",
        count: 12,
        children: [
          { key: "pipe-comp-10", title: "透平油供油主管", code: "PL-006", type: "component" },
        ],
      },
      {
        key: "pipe-4-2",
        title: "排油系统",
        code: "PIPE-009",
        type: "usage",
        count: 10,
        children: [
          { key: "pipe-comp-10-1", title: "透平油排油管", code: "PL-031", type: "component" },
        ],
      },
    ],
  },
  {
    key: "pipesys-5",
    title: "消防水系统",
    code: "PIPE-SYS-005",
    type: "system",
    count: 26,
    children: [
      {
        key: "pipe-5-1",
        title: "主管路",
        code: "PIPE-010",
        type: "usage",
        count: 10,
        children: [
          { key: "pipe-comp-11", title: "消防水主管", code: "PL-007", type: "component" },
          { key: "pipe-comp-12", title: "厂区消防主管", code: "PL-008", type: "component" },
        ],
      },
      {
        key: "pipe-5-2",
        title: "分支管路",
        code: "PIPE-011",
        type: "usage",
        count: 16,
        children: [
          { key: "pipe-comp-12-1", title: "厂房消防分支管", code: "PL-032", type: "component" },
        ],
      },
    ],
  },
];

// 厂房全景融合结构树（包含设备、管路、厂房结构）
export const panoramaTreeData: TreeNodeData[] = [
  {
    key: "pan-equipment",
    title: "机电设备",
    code: "EQ-GRP",
    type: "equipment-group",
    count: 156,
    children: [
      { key: "EQ-TUR-GRP", title: "水轮机", code: "EQ-TUR-GRP", type: "equipment-group", count: 4, children: [
        { key: "EQ-TUR-01", title: "1#水泵水轮机", code: "EQ-TUR-01", type: "equipment", count: 1 },
        { key: "EQ-TUR-02", title: "2#水泵水轮机", code: "EQ-TUR-02", type: "equipment", count: 1 },
        { key: "EQ-TUR-03", title: "3#水泵水轮机", code: "EQ-TUR-03", type: "equipment", count: 1 },
        { key: "EQ-TUR-04", title: "4#水泵水轮机", code: "EQ-TUR-04", type: "equipment", count: 1 },
      ]},
      { key: "EQ-GEN-GRP", title: "发电机", code: "EQ-GEN-GRP", type: "equipment-group", count: 4, children: [
        { key: "EQ-GEN-01", title: "1#发电电动机", code: "EQ-GEN-01", type: "equipment", count: 1 },
        { key: "EQ-GEN-02", title: "2#发电电动机", code: "EQ-GEN-02", type: "equipment", count: 1 },
        { key: "EQ-GEN-03", title: "3#发电电动机", code: "EQ-GEN-03", type: "equipment", count: 1 },
        { key: "EQ-GEN-04", title: "4#发电电动机", code: "EQ-GEN-04", type: "equipment", count: 1 },
      ]},
      { key: "EQ-TXF-GRP", title: "主变压器", code: "EQ-TXF-GRP", type: "equipment-group", count: 4, children: [
        { key: "EQ-TXF-01", title: "1#主变压器", code: "EQ-TXF-01", type: "equipment", count: 1 },
        { key: "EQ-TXF-02", title: "2#主变压器", code: "EQ-TXF-02", type: "equipment", count: 1 },
        { key: "EQ-TXF-03", title: "3#主变压器", code: "EQ-TXF-03", type: "equipment", count: 1 },
        { key: "EQ-TXF-04", title: "4#主变压器", code: "EQ-TXF-04", type: "equipment", count: 1 },
      ]},
      { key: "EQ-EXC-GRP", title: "励磁系统", code: "EQ-EXC-GRP", type: "equipment-group", count: 4, children: [
        { key: "EQ-EXC-01", title: "1#励磁系统", code: "EQ-EXC-01", type: "equipment", count: 1 },
        { key: "EQ-EXC-02", title: "2#励磁系统", code: "EQ-EXC-02", type: "equipment", count: 1 },
        { key: "EQ-EXC-03", title: "3#励磁系统", code: "EQ-EXC-03", type: "equipment", count: 1 },
        { key: "EQ-EXC-04", title: "4#励磁系统", code: "EQ-EXC-04", type: "equipment", count: 1 },
      ]},
      { key: "EQ-GOV-GRP", title: "调速器", code: "EQ-GOV-GRP", type: "equipment-group", count: 4, children: [
        { key: "EQ-GOV-01", title: "1#调速器", code: "EQ-GOV-01", type: "equipment", count: 1 },
        { key: "EQ-GOV-02", title: "2#调速器", code: "EQ-GOV-02", type: "equipment", count: 1 },
        { key: "EQ-GOV-03", title: "3#调速器", code: "EQ-GOV-03", type: "equipment", count: 1 },
        { key: "EQ-GOV-04", title: "4#调速器", code: "EQ-GOV-04", type: "equipment", count: 1 },
      ]},
      { key: "EQ-CRAN-GRP", title: "主厂房桥机", code: "EQ-CRAN-GRP", type: "equipment-group", count: 1, children: [
        { key: "EQ-CRAN-01", title: "主厂房桥机", code: "EQ-CRAN-01", type: "equipment", count: 1 },
      ]},
      { key: "EQ-AIR-GRP", title: "空调设备", code: "EQ-AIR-GRP", type: "equipment-group", count: 8, children: [
        { key: "EQ-AIR-01", title: "1#空调机组", code: "EQ-AIR-01", type: "equipment", count: 1 },
        { key: "EQ-AIR-02", title: "2#空调机组", code: "EQ-AIR-02", type: "equipment", count: 1 },
        { key: "EQ-AIR-03", title: "3#空调机组", code: "EQ-AIR-03", type: "equipment", count: 1 },
        { key: "EQ-AIR-04", title: "4#空调机组", code: "EQ-AIR-04", type: "equipment", count: 1 },
      ]},
      { key: "EQ-GATE-GRP", title: "闸门启闭机", code: "EQ-GATE-GRP", type: "equipment-group", count: 12, children: [
        { key: "EQ-GATE-01", title: "1#闸门启闭机", code: "EQ-GATE-01", type: "equipment", count: 1 },
        { key: "EQ-GATE-02", title: "2#闸门启闭机", code: "EQ-GATE-02", type: "equipment", count: 1 },
        { key: "EQ-GATE-03", title: "3#闸门启闭机", code: "EQ-GATE-03", type: "equipment", count: 1 },
        { key: "EQ-GATE-04", title: "4#闸门启闭机", code: "EQ-GATE-04", type: "equipment", count: 1 },
      ]},
    ],
  },
  {
    key: "pan-pipeline",
    title: "辅机管网系统",
    code: "PIPE-GRP",
    type: "pipeline-group",
    count: 236,
    children: [
      { key: "SYS-Tech", title: "技术供水系统", code: "SYS-001", type: "system", count: 45, children: [
        { key: "pipe-1-1", title: "主管路", code: "PIPE-001", type: "usage", count: 12, children: [
          { key: "pipe-1-1-1", title: "1#机组技术供水主管", code: "PL-001", type: "component" },
          { key: "pipe-1-1-2", title: "2#机组技术供水主管", code: "PL-002", type: "component" },
          { key: "pipe-1-1-3", title: "3#机组技术供水主管", code: "PL-003", type: "component" },
          { key: "pipe-1-1-4", title: "4#机组技术供水主管", code: "PL-004", type: "component" },
        ]},
        { key: "pipe-1-2", title: "分支管路", code: "PIPE-002", type: "usage", count: 16, children: [
          { key: "pipe-1-2-1", title: "技术供水滤水器管路", code: "PL-005", type: "component" },
          { key: "pipe-1-2-2", title: "技术供水冷却器管路", code: "PL-006", type: "component" },
        ]},
      ]},
      { key: "SYS-Drain", title: "排水系统", code: "SYS-002", type: "system", count: 42, children: [
        { key: "pipe-2-1", title: "主管路", code: "PIPE-003", type: "usage", count: 10, children: [
          { key: "pipe-2-1-1", title: "厂房排水主管", code: "PL-010", type: "component" },
          { key: "pipe-2-1-2", title: "渗漏排水主管", code: "PL-011", type: "component" },
        ]},
        { key: "pipe-2-2", title: "分支管路", code: "PIPE-004", type: "usage", count: 16, children: [
          { key: "pipe-2-2-1", title: "1#渗漏排水泵管路", code: "PL-012", type: "component" },
          { key: "pipe-2-2-2", title: "2#渗漏排水泵管路", code: "PL-013", type: "component" },
        ]},
      ]},
      { key: "SYS-Air", title: "气系统", code: "SYS-003", type: "system", count: 32, children: [
        { key: "pipe-3-1", title: "主管路", code: "PIPE-005", type: "usage", count: 8, children: [
          { key: "pipe-3-1-1", title: "压缩空气主管", code: "PL-018", type: "component" },
          { key: "pipe-3-1-2", title: "制动空气主管", code: "PL-019", type: "component" },
        ]},
        { key: "pipe-3-2", title: "分支管路", code: "PIPE-006", type: "usage", count: 12, children: [
          { key: "pipe-3-2-1", title: "储气罐连接管", code: "PL-020", type: "component" },
        ]},
      ]},
      { key: "SYS-Oil", title: "透平油系统", code: "SYS-004", type: "system", count: 28, children: [
        { key: "pipe-4-1", title: "主管路", code: "PIPE-007", type: "usage", count: 8, children: [
          { key: "pipe-4-1-1", title: "1#机组透平油主管", code: "PL-024", type: "component" },
          { key: "pipe-4-1-2", title: "2#机组透平油主管", code: "PL-025", type: "component" },
        ]},
        { key: "pipe-4-2", title: "分支管路", code: "PIPE-008", type: "usage", count: 8, children: [
          { key: "pipe-4-2-1", title: "油压装置管路", code: "PL-026", type: "component" },
        ]},
      ]},
      { key: "SYS-Fire", title: "消防水系统", code: "SYS-005", type: "system", count: 35, children: [
        { key: "pipe-5-1", title: "主管路", code: "PIPE-009", type: "usage", count: 8, children: [
          { key: "pipe-5-1-1", title: "消防水主管", code: "PL-028", type: "component" },
          { key: "pipe-5-1-2", title: "厂房消火栓主管", code: "PL-029", type: "component" },
        ]},
        { key: "pipe-5-2", title: "分支管路", code: "PIPE-011", type: "usage", count: 16, children: [
          { key: "pipe-5-2-1", title: "厂房消防分支管", code: "PL-032", type: "component" },
        ]},
      ]},
    ],
  },
  {
    key: "pan-structure",
    title: "厂房结构",
    code: "STR-GRP",
    type: "structure-group",
    count: 6,
    children: [
      { key: "STR-01", title: "主厂房", code: "STR-001", type: "structure", count: 4 },
      { key: "STR-02", title: "副厂房", code: "STR-002", type: "structure", count: 2 },
      { key: "STR-03", title: "主变室", code: "STR-003", type: "structure", count: 4 },
      { key: "STR-04", title: "安装间", code: "STR-004", type: "structure", count: 1 },
      { key: "STR-05", title: "进厂交通洞", code: "STR-005", type: "structure", count: 1 },
      { key: "STR-06", title: "顶部出线平台", code: "STR-006", type: "structure", count: 1 },
    ],
  },
];

// 设备属性信息（Mock） - 详细数据
export const equipmentInfo: Record<string, any> = {
  "1#水泵水轮机": {
    basic: { code: "EQ-001", name: "1#水泵水轮机", type: "水泵水轮机", system: "技术供水", major: "机械", location: "坝后厂房-水轮机层", model: "HLA855-LJ-425", manufacturer: "哈尔滨电机厂", commissionDate: "2020-06-15" },
    techParams: [
      { name: "单机容量", value: "125", unit: "MW" }, { name: "额定水头", value: "95", unit: "m" },
      { name: "最大水头", value: "110", unit: "m" }, { name: "最小水头", value: "75", unit: "m" },
      { name: "额定转速", value: "150", unit: "r/min" }, { name: "额定流量", value: "145", unit: "m³/s" },
      { name: "额定效率", value: "94.5", unit: "%" }, { name: "转轮直径", value: "4.25", unit: "m" },
    ],
    documents: [
      { name: "1#水泵水轮机使用说明书", category: "设备说明书", date: "2026-06-15", fileType: "PDF", fileSize: "5.2MB" },
      { name: "1#水泵水轮机检修记录", category: "检修记录", date: "2026-06-20", fileType: "Word", fileSize: "1.8MB" },
      { name: "1#水泵水轮机验收报告", category: "验收报告", date: "2020-06-15", fileType: "PDF", fileSize: "3.1MB" },
    ],
    designParams: [
      { name: "设计流量", value: 145, unit: "m³/h" }, { name: "设计压力", value: 1.6, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: 125, unit: "MW" },
      { name: "额定转速", value: 150, unit: "rpm" },
    ],
  },
  "2#水泵水轮机": {
    basic: { code: "EQ-002", name: "2#水泵水轮机", type: "水泵水轮机", system: "技术供水", major: "机械", location: "坝后厂房-水轮机层", model: "HLA855-LJ-425", manufacturer: "哈尔滨电机厂", commissionDate: "2020-07-20" },
    techParams: [
      { name: "单机容量", value: "125", unit: "MW" }, { name: "额定水头", value: "95", unit: "m" },
      { name: "额定转速", value: "150", unit: "r/min" }, { name: "额定流量", value: "145", unit: "m³/s" },
      { name: "额定效率", value: "94.2", unit: "%" }, { name: "转轮直径", value: "4.25", unit: "m" },
    ],
    documents: [
      { name: "2#水泵水轮机使用说明书", category: "设备说明书", date: "2026-06-15", fileType: "PDF", fileSize: "5.2MB" },
      { name: "2#水泵水轮机检修记录", category: "检修记录", date: "2026-05-18", fileType: "Word", fileSize: "1.6MB" },
    ],
    designParams: [
      { name: "设计流量", value: 145, unit: "m³/h" }, { name: "设计压力", value: 1.6, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: 125, unit: "MW" },
      { name: "额定转速", value: 150, unit: "rpm" },
    ],
  },
  "1#技术供水泵": {
    basic: { code: "EQ-003", name: "1#技术供水泵", type: "水泵", system: "技术供水", major: "机械", location: "坝后厂房-水泵层", model: "KQSN200-M4", manufacturer: "上海凯泉泵业", commissionDate: "2020-05-10" },
    techParams: [
      { name: "额定流量", value: "200", unit: "m³/h" }, { name: "额定扬程", value: "60", unit: "m" },
      { name: "额定功率", value: "55", unit: "kW" }, { name: "额定转速", value: "1480", unit: "r/min" },
      { name: "效率", value: "82", unit: "%" }, { name: "口径", value: "DN200", unit: "" },
    ],
    documents: [
      { name: "1#技术供水泵使用说明书", category: "设备说明书", date: "2026-04-10", fileType: "PDF", fileSize: "2.5MB" },
      { name: "1#技术供水泵巡检记录", category: "检修记录", date: "2026-07-25", fileType: "Excel", fileSize: "0.8MB" },
    ],
    designParams: [
      { name: "设计流量", value: 200, unit: "m³/h" }, { name: "设计压力", value: 1.0, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: 55, unit: "kW" },
      { name: "额定转速", value: 1480, unit: "rpm" },
    ],
  },
  "2#技术供水泵": {
    basic: { code: "EQ-004", name: "2#技术供水泵", type: "水泵", system: "技术供水", major: "机械", location: "坝后厂房-水泵层", model: "KQSN200-M4", manufacturer: "上海凯泉泵业", commissionDate: "2020-05-10" },
    techParams: [
      { name: "额定流量", value: "200", unit: "m³/h" }, { name: "额定扬程", value: "60", unit: "m" },
      { name: "额定功率", value: "55", unit: "kW" }, { name: "额定转速", value: "1480", unit: "r/min" },
    ],
    documents: [
      { name: "2#技术供水泵使用说明书", category: "设备说明书", date: "2026-04-10", fileType: "PDF", fileSize: "2.5MB" },
    ],
    designParams: [
      { name: "设计流量", value: 200, unit: "m³/h" }, { name: "设计压力", value: 1.0, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: 55, unit: "kW" },
      { name: "额定转速", value: 1480, unit: "rpm" },
    ],
  },
  "1#进水阀": {
    basic: { code: "EQ-009", name: "1#进水阀", type: "进水阀", system: "技术供水", major: "机械", location: "坝后厂房-进水阀廊道", model: "KD741X-46", manufacturer: "铁岭阀门厂", commissionDate: "2020-04-25" },
    techParams: [
      { name: "公称直径", value: "DN2600", unit: "" }, { name: "公称压力", value: "PN46", unit: "" },
      { name: "操作方式", value: "液压", unit: "" }, { name: "开启时间", value: "120", unit: "s" },
      { name: "关闭时间", value: "60", unit: "s" },
    ],
    documents: [
      { name: "1#进水阀使用说明书", category: "设备说明书", date: "2026-03-15", fileType: "PDF", fileSize: "3.8MB" },
      { name: "1#进水阀检修记录", category: "检修记录", date: "2026-06-08", fileType: "Word", fileSize: "1.2MB" },
    ],
    designParams: [
      { name: "设计流量", value: "—", unit: "" }, { name: "设计压力", value: 4.6, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "1#低压空压机": {
    basic: { code: "EQ-007", name: "1#低压空压机", type: "空压机", system: "气系统", major: "机械", location: "坝后厂房-空压机室", model: "LU7-10", manufacturer: "阿特拉斯·科普柯", commissionDate: "2020-08-15" },
    techParams: [
      { name: "排气量", value: "10", unit: "m³/min" }, { name: "排气压力", value: "0.8", unit: "MPa" },
      { name: "额定功率", value: "75", unit: "kW" }, { name: "冷却方式", value: "风冷", unit: "" },
    ],
    documents: [
      { name: "1#低压空压机使用说明书", category: "设备说明书", date: "2026-05-20", fileType: "PDF", fileSize: "4.1MB" },
      { name: "1#低压空压机保养记录", category: "检修记录", date: "2026-07-30", fileType: "Excel", fileSize: "0.5MB" },
    ],
    designParams: [
      { name: "设计流量", value: 10, unit: "m³/min" }, { name: "设计压力", value: 0.8, unit: "MPa" },
      { name: "设计温度", value: 40, unit: "℃" }, { name: "额定功率", value: 75, unit: "kW" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "1#高压空压机": {
    basic: { code: "EQ-008", name: "1#高压空压机", type: "空压机", system: "气系统", major: "机械", location: "坝后厂房-空压机室", model: "GA22", manufacturer: "阿特拉斯·科普柯", commissionDate: "2020-08-15" },
    techParams: [
      { name: "排气量", value: "3.5", unit: "m³/min" }, { name: "排气压力", value: "4.0", unit: "MPa" },
      { name: "额定功率", value: "22", unit: "kW" }, { name: "冷却方式", value: "风冷", unit: "" },
    ],
    documents: [
      { name: "1#高压空压机使用说明书", category: "设备说明书", date: "2026-05-20", fileType: "PDF", fileSize: "3.9MB" },
    ],
    designParams: [
      { name: "设计流量", value: 3.5, unit: "m³/min" }, { name: "设计压力", value: 4.0, unit: "MPa" },
      { name: "设计温度", value: 40, unit: "℃" }, { name: "额定功率", value: 22, unit: "kW" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "1#发电电动机": {
    basic: { code: "EQ-005", name: "1#发电电动机", type: "发电电动机", system: "技术供水", major: "电气", location: "坝后厂房-发电机层", model: "SF125-40/8500", manufacturer: "东方电机厂", commissionDate: "2020-06-20" },
    techParams: [
      { name: "额定容量", value: "125", unit: "MW" }, { name: "额定电压", value: "13.8", unit: "kV" },
      { name: "额定电流", value: "5623", unit: "A" }, { name: "功率因数", value: "0.875", unit: "" },
      { name: "额定转速", value: "150", unit: "r/min" }, { name: "频率", value: "50", unit: "Hz" },
      { name: "效率", value: "98.2", unit: "%" }, { name: "绝缘等级", value: "F", unit: "" },
    ],
    documents: [
      { name: "1#发电电动机使用说明书", category: "设备说明书", date: "2026-06-15", fileType: "PDF", fileSize: "6.8MB" },
      { name: "1#发电电动机检修记录", category: "检修记录", date: "2026-06-25", fileType: "Word", fileSize: "2.3MB" },
      { name: "1#发电电动机验收报告", category: "验收报告", date: "2020-06-20", fileType: "PDF", fileSize: "4.5MB" },
    ],
    designParams: [
      { name: "设计流量", value: "—", unit: "" }, { name: "设计压力", value: "—", unit: "" },
      { name: "设计温度", value: 80, unit: "℃" }, { name: "额定功率", value: 125, unit: "MW" },
      { name: "额定转速", value: 150, unit: "rpm" },
    ],
  },
  "1#主变压器": {
    basic: { code: "EQ-006", name: "1#主变压器", type: "主变压器", system: "技术供水", major: "电气", location: "开关站", model: "SSP-150000/220", manufacturer: "特变电工", commissionDate: "2020-07-05" },
    techParams: [
      { name: "额定容量", value: "150", unit: "MVA" }, { name: "额定电压", value: "220", unit: "kV" },
      { name: "额定电流", value: "394", unit: "A" }, { name: "接线组别", value: "YNd11", unit: "" },
      { name: "阻抗电压", value: "10.5", unit: "%" }, { name: "空载损耗", value: "120", unit: "kW" },
      { name: "负载损耗", value: "450", unit: "kW" }, { name: "冷却方式", value: "ONAN/ONAF", unit: "" },
    ],
    documents: [
      { name: "1#主变压器使用说明书", category: "设备说明书", date: "2026-04-20", fileType: "PDF", fileSize: "7.2MB" },
      { name: "1#主变压器油化验报告", category: "验收报告", date: "2026-07-28", fileType: "PDF", fileSize: "1.1MB" },
    ],
    designParams: [
      { name: "设计流量", value: "—", unit: "" }, { name: "设计压力", value: "—", unit: "" },
      { name: "设计温度", value: 85, unit: "℃" }, { name: "额定功率", value: 150, unit: "MVA" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "1#开关柜": {
    basic: { code: "EQ-010", name: "1#开关柜", type: "开关柜", system: "技术供水", major: "电气", location: "坝后厂房-开关柜室", model: "KYN28A-12", manufacturer: "许继电气", commissionDate: "2020-07-10" },
    techParams: [
      { name: "额定电压", value: "12", unit: "kV" }, { name: "额定电流", value: "1250", unit: "A" },
      { name: "额定开断电流", value: "31.5", unit: "kA" }, { name: "防护等级", value: "IP4X", unit: "" },
    ],
    documents: [
      { name: "1#开关柜使用说明书", category: "设备说明书", date: "2026-05-10", fileType: "PDF", fileSize: "3.5MB" },
    ],
    designParams: [
      { name: "设计流量", value: "—", unit: "" }, { name: "设计压力", value: "—", unit: "" },
      { name: "设计温度", value: 40, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "进水口闸门": {
    basic: { code: "EQ-011", name: "进水口闸门", type: "闸门", system: "闸门设备", major: "水工", location: "进水口", model: "PGZ-3500", manufacturer: "水利机械厂", commissionDate: "2019-12-20" },
    techParams: [
      { name: "闸门尺寸", value: "3.5×4.0", unit: "m" }, { name: "设计水头", value: "110", unit: "m" },
      { name: "操作方式", value: "液压启闭机", unit: "" }, { name: "启闭力", value: "800", unit: "kN" },
    ],
    documents: [
      { name: "进水口闸门使用说明书", category: "设备说明书", date: "2026-02-15", fileType: "PDF", fileSize: "4.3MB" },
      { name: "进水口闸门检测报告", category: "验收报告", date: "2026-06-18", fileType: "PDF", fileSize: "2.7MB" },
    ],
    designParams: [
      { name: "设计流量", value: "—", unit: "" }, { name: "设计压力", value: 1.1, unit: "MPa" },
      { name: "设计温度", value: "—", unit: "" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "尾水闸门": {
    basic: { code: "EQ-012", name: "尾水闸门", type: "闸门", system: "闸门设备", major: "水工", location: "尾水出口", model: "PGZ-3000", manufacturer: "水利机械厂", commissionDate: "2019-12-20" },
    techParams: [
      { name: "闸门尺寸", value: "3.0×3.5", unit: "m" }, { name: "设计水头", value: "30", unit: "m" },
      { name: "操作方式", value: "液压启闭机", unit: "" }, { name: "启闭力", value: "500", unit: "kN" },
    ],
    documents: [
      { name: "尾水闸门使用说明书", category: "设备说明书", date: "2026-02-15", fileType: "PDF", fileSize: "3.8MB" },
    ],
    designParams: [
      { name: "设计流量", value: "—", unit: "" }, { name: "设计压力", value: 0.3, unit: "MPa" },
      { name: "设计温度", value: "—", unit: "" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  // 大坝主体信息
  "大坝主体": {
    basic: { code: "DM-001", name: "大坝主体", type: "混凝土重力坝", system: "挡水建筑物", major: "水工", location: "乌江渡水电站", model: "—", manufacturer: "—", commissionDate: "1979-12-31" },
    techParams: [
      { name: "坝高", value: "134", unit: "m" }, { name: "坝长", value: "366", unit: "m" },
      { name: "坝顶宽", value: "10", unit: "m" }, { name: "坝底宽", value: "120", unit: "m" },
      { name: "正常蓄水位", value: "760", unit: "m" }, { name: "死水位", value: "720", unit: "m" },
      { name: "总库容", value: "21.4", unit: "亿m³" }, { name: "调节库容", value: "10.8", unit: "亿m³" },
      { name: "溢洪道孔数", value: "4", unit: "孔" }, { name: "溢洪道总宽", value: "48", unit: "m" },
    ],
    documents: [
      { name: "大坝设计报告", category: "设计文档", date: "1979-06-01", fileType: "PDF", fileSize: "15.2MB" },
      { name: "大坝施工图纸", category: "施工图纸", date: "1978-12-15", fileType: "CAD", fileSize: "28.5MB" },
      { name: "大坝安全监测报告", category: "监测报告", date: "2026-07-01", fileType: "PDF", fileSize: "8.1MB" },
      { name: "大坝维护手册", category: "维护手册", date: "2025-01-10", fileType: "Word", fileSize: "6.3MB" },
    ],
    designParams: [
      { name: "设计洪水标准", value: "千年一遇", unit: "" }, { name: "校核洪水标准", value: "万年一遇", unit: "" },
      { name: "抗震设防烈度", value: "6度", unit: "" }, { name: "坝体混凝土等级", value: "C25", unit: "" },
      { name: "稳定安全系数", value: "1.35", unit: "" },
    ],
  },
};

// 管件属性信息（Mock） - 详细数据
export const componentInfo: Record<string, any> = {
  "1#机组技术供水主管": {
    basic: { code: "PL-001", name: "1#机组技术供水主管", type: "管道段", spec: "DN300", material: "碳钢", length: "125.5m", position: "坝后厂房", system: "技术供水", usage: "主管路" },
    techParams: [
      { name: "设计压力", value: "1.6", unit: "MPa" }, { name: "设计温度", value: "30", unit: "℃" },
      { name: "工作介质", value: "水", unit: "" }, { name: "壁厚", value: "8", unit: "mm" },
      { name: "防腐方式", value: "环氧树脂涂层", unit: "" },
    ],
    linkedEquipments: [
      { code: "EQ-003", name: "1#技术供水泵", model: "KQSN200-M4" },
      { code: "EQ-001", name: "1#水泵水轮机", model: "HLA855-LJ-425" },
    ],
    documents: [
      { name: "1#机组技术供水主管安装记录", category: "验收报告", date: "2026-05-15", fileType: "PDF", fileSize: "2.1MB" },
      { name: "技术供水系统P&ID图", category: "设计图", date: "2026-07-20", fileType: "PDF", fileSize: "1.5MB" },
    ],
    designParams: [
      { name: "设计流量", value: 200, unit: "m³/h" }, { name: "设计压力", value: 1.6, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "2#机组技术供水主管": {
    basic: { code: "PL-002", name: "2#机组技术供水主管", type: "管道段", spec: "DN300", material: "碳钢", length: "118.2m", position: "坝后厂房", system: "技术供水", usage: "主管路" },
    techParams: [
      { name: "设计压力", value: "1.6", unit: "MPa" }, { name: "设计温度", value: "30", unit: "℃" },
      { name: "工作介质", value: "水", unit: "" }, { name: "壁厚", value: "8", unit: "mm" },
    ],
    documents: [
      { name: "2#机组技术供水主管安装记录", category: "验收报告", date: "2026-05-16", fileType: "PDF", fileSize: "2.0MB" },
    ],
    designParams: [
      { name: "设计流量", value: 200, unit: "m³/h" }, { name: "设计压力", value: 1.6, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "技术供水总阀": {
    basic: { code: "VL-001", name: "技术供水总阀", type: "蝶阀", spec: "DN300", material: "铸钢", length: "1台", position: "坝后厂房", system: "技术供水", usage: "主管路" },
    techParams: [
      { name: "公称直径", value: "DN300", unit: "" }, { name: "公称压力", value: "PN16", unit: "" },
      { name: "驱动方式", value: "电动", unit: "" }, { name: "开启时间", value: "30", unit: "s" },
    ],
    documents: [
      { name: "技术供水总阀使用说明书", category: "设备说明书", date: "2026-03-10", fileType: "PDF", fileSize: "1.8MB" },
    ],
    designParams: [
      { name: "设计流量", value: 200, unit: "m³/h" }, { name: "设计压力", value: 1.6, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: 2.2, unit: "kW" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "1#机组分支管": {
    basic: { code: "PL-010", name: "1#机组分支管", type: "管道段", spec: "DN150", material: "不锈钢", length: "45.3m", position: "坝后厂房", system: "技术供水", usage: "分支管路" },
    techParams: [
      { name: "设计压力", value: "1.0", unit: "MPa" }, { name: "设计温度", value: "30", unit: "℃" },
      { name: "工作介质", value: "水", unit: "" }, { name: "壁厚", value: "4", unit: "mm" },
    ],
    documents: [
      { name: "1#机组分支管安装记录", category: "验收报告", date: "2026-05-18", fileType: "PDF", fileSize: "1.2MB" },
    ],
    designParams: [
      { name: "设计流量", value: 80, unit: "m³/h" }, { name: "设计压力", value: 1.0, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "2#机组分支管": {
    basic: { code: "PL-011", name: "2#机组分支管", type: "管道段", spec: "DN150", material: "不锈钢", length: "42.1m", position: "坝后厂房", system: "技术供水", usage: "分支管路" },
    techParams: [
      { name: "设计压力", value: "1.0", unit: "MPa" }, { name: "工作介质", value: "水", unit: "" },
      { name: "壁厚", value: "4", unit: "mm" },
    ],
    documents: [],
    designParams: [
      { name: "设计流量", value: 80, unit: "m³/h" }, { name: "设计压力", value: 1.0, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "1#水泵连接管": {
    basic: { code: "PL-020", name: "1#水泵连接管", type: "管道段", spec: "DN200", material: "碳钢", length: "8.5m", position: "坝后厂房-水泵层", system: "技术供水", usage: "设备连接管" },
    techParams: [
      { name: "设计压力", value: "1.0", unit: "MPa" }, { name: "工作介质", value: "水", unit: "" },
      { name: "壁厚", value: "6", unit: "mm" },
    ],
    documents: [],
    designParams: [
      { name: "设计流量", value: 50, unit: "m³/h" }, { name: "设计压力", value: 1.0, unit: "MPa" },
      { name: "设计温度", value: 30, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "厂房排水主管": {
    basic: { code: "PL-003", name: "厂房排水主管", type: "管道段", spec: "DN250", material: "UPVC", length: "85.6m", position: "坝后厂房", system: "排水", usage: "主管路" },
    techParams: [
      { name: "设计压力", value: "0.5", unit: "MPa" }, { name: "工作介质", value: "排水", unit: "" },
      { name: "壁厚", value: "6", unit: "mm" }, { name: "防腐方式", value: "无需防腐", unit: "" },
    ],
    documents: [
      { name: "厂房排水主管安装记录", category: "验收报告", date: "2026-04-22", fileType: "PDF", fileSize: "1.6MB" },
    ],
    designParams: [
      { name: "设计流量", value: 120, unit: "m³/h" }, { name: "设计压力", value: 0.5, unit: "MPa" },
      { name: "设计温度", value: 25, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "低压气系统主管": {
    basic: { code: "PL-004", name: "低压气系统主管", type: "管道段", spec: "DN80", material: "无缝钢管", length: "62.3m", position: "坝后厂房", system: "气系统", usage: "主管路" },
    techParams: [
      { name: "设计压力", value: "1.0", unit: "MPa" }, { name: "工作介质", value: "压缩空气", unit: "" },
      { name: "壁厚", value: "4", unit: "mm" },
    ],
    documents: [
      { name: "低压气系统P&ID图", category: "设计图", date: "2026-07-20", fileType: "PDF", fileSize: "1.3MB" },
    ],
    designParams: [
      { name: "设计流量", value: 10, unit: "m³/min" }, { name: "设计压力", value: 1.0, unit: "MPa" },
      { name: "设计温度", value: 40, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "高压气系统主管": {
    basic: { code: "PL-005", name: "高压气系统主管", type: "管道段", spec: "DN50", material: "无缝钢管", length: "48.7m", position: "坝后厂房", system: "气系统", usage: "主管路" },
    techParams: [
      { name: "设计压力", value: "5.0", unit: "MPa" }, { name: "工作介质", value: "压缩空气", unit: "" },
      { name: "壁厚", value: "5", unit: "mm" },
    ],
    documents: [],
    designParams: [
      { name: "设计流量", value: 3.5, unit: "m³/min" }, { name: "设计压力", value: 5.0, unit: "MPa" },
      { name: "设计温度", value: 40, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "透平油供油主管": {
    basic: { code: "PL-006", name: "透平油供油主管", type: "管道段", spec: "DN50", material: "不锈钢", length: "35.2m", position: "坝后厂房", system: "透平油", usage: "主管路" },
    techParams: [
      { name: "设计压力", value: "0.6", unit: "MPa" }, { name: "工作介质", value: "透平油", unit: "" },
      { name: "壁厚", value: "3", unit: "mm" },
    ],
    documents: [
      { name: "透平油系统P&ID图", category: "设计图", date: "2026-07-20", fileType: "PDF", fileSize: "1.1MB" },
    ],
    designParams: [
      { name: "设计流量", value: 5, unit: "m³/h" }, { name: "设计压力", value: 0.6, unit: "MPa" },
      { name: "设计温度", value: 50, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "消防水主管": {
    basic: { code: "PL-007", name: "消防水主管", type: "管道段", spec: "DN100", material: "镀锌钢管", length: "120.5m", position: "大坝", system: "消防水", usage: "主管路" },
    techParams: [
      { name: "设计压力", value: "1.2", unit: "MPa" }, { name: "工作介质", value: "消防水", unit: "" },
      { name: "壁厚", value: "5", unit: "mm" },
    ],
    documents: [
      { name: "消防水系统安装验收记录", category: "验收报告", date: "2026-03-25", fileType: "PDF", fileSize: "2.3MB" },
    ],
    designParams: [
      { name: "设计流量", value: 30, unit: "m³/h" }, { name: "设计压力", value: 1.2, unit: "MPa" },
      { name: "设计温度", value: 25, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
  "厂区消防主管": {
    basic: { code: "PL-008", name: "厂区消防主管", type: "管道段", spec: "DN100", material: "镀锌钢管", length: "210.8m", position: "厂区", system: "消防水", usage: "主管路" },
    techParams: [
      { name: "设计压力", value: "1.2", unit: "MPa" }, { name: "工作介质", value: "消防水", unit: "" },
      { name: "壁厚", value: "5", unit: "mm" },
    ],
    documents: [],
    designParams: [
      { name: "设计流量", value: 50, unit: "m³/h" }, { name: "设计压力", value: 1.2, unit: "MPa" },
      { name: "设计温度", value: 25, unit: "℃" }, { name: "额定功率", value: "—", unit: "" },
      { name: "额定转速", value: "—", unit: "" },
    ],
  },
};

// 节点信息生成器 - 为树中系统/位置/用途等父级节点生成汇总信息
export function generateNodeInfo(node: TreeNodeData): any | null {
  // 系统级节点
  if (node.type === "system" || node.title.includes("系统")) {
    const sysName = node.title.replace("系统", "");
    return {
      basic: {
        code: node.code || "",
        name: node.title,
        type: "系统",
        position: "全厂",
        system: sysName,
        count: node.count || 0,
      },
      techParams: [
        { name: "设备数量", value: String(Math.floor((node.count || 0) * 0.6)), unit: "台" },
        { name: "管路数量", value: String(Math.floor((node.count || 0) * 0.3)), unit: "条" },
        { name: "管件数量", value: String(node.count || 0), unit: "个" },
        { name: "运行状态", value: "正常运行", unit: "" },
      ],
      documents: [],
      designParams: [
        { name: "设备总数", value: Math.floor((node.count || 0) * 0.6), unit: "台" },
        { name: "管路总数", value: Math.floor((node.count || 0) * 0.3), unit: "条" },
      ],
    };
  }
  // 位置级节点
  if (node.type === "position") {
    return {
      basic: {
        code: node.code || "",
        name: node.title,
        type: "位置区域",
        count: node.count || 0,
      },
      techParams: [
        { name: "设备总数", value: String(Math.floor((node.count || 0) * 0.6)), unit: "台" },
        { name: "管路总数", value: String(Math.floor((node.count || 0) * 0.3)), unit: "条" },
        { name: "管件总数", value: String(node.count || 0), unit: "个" },
      ],
      documents: [],
      designParams: [],
    };
  }
  // 专业级节点
  if (node.title.includes("专业")) {
    return {
      basic: { code: node.code || "", name: node.title, type: "专业分类", count: node.count || 0 },
      techParams: [
        { name: "设备数量", value: String(node.count || 0), unit: "台" },
        { name: "运行率", value: "96.8", unit: "%" },
      ],
      documents: [],
      designParams: [],
    };
  }
  // 用途级节点
  if (node.type === "usage") {
    return {
      basic: { code: node.code || "", name: node.title, type: "管路用途", count: node.count || 0 },
      techParams: [
        { name: "管件数量", value: String(node.count || 0), unit: "个" },
        { name: "阀门数量", value: String(Math.floor((node.count || 0) * 0.2)), unit: "个" },
      ],
      documents: [],
      designParams: [],
    };
  }
  return null;
}

// 全厂统计信息
export const overallStats = {
  equipmentTotal: 248,
  pipelineTotal: 56,
  componentTotal: 1240,
  valveTotal: 186,
  bySystem: [
    { system: "技术供水", equipment: 85, pipeline: 18, component: 320 },
    { system: "排水", equipment: 45, pipeline: 12, component: 180 },
    { system: "气系统", equipment: 38, pipeline: 10, component: 156 },
    { system: "透平油", equipment: 42, pipeline: 8, component: 124 },
    { system: "消防水", equipment: 38, pipeline: 8, component: 140 },
  ],
};

// ===== 大屏左右栏卡片数据 =====

// 管路统计：按系统的管路总长度（m）
export const pipelineLengthBySystem = [
  { system: "技术供水", length: 3560.5 },
  { system: "排水", length: 1820.3 },
  { system: "气系统", length: 1240.6 },
  { system: "透平油", length: 860.2 },
  { system: "消防水", length: 1520.8 },
];

// 各系统下按管路规格（DN）的累计长度（m）：点击管路柱状图弹窗展示
export const pipelineSpecBySystem: Record<string, { spec: string; length: number }[]> = {
  技术供水: [
    { spec: "DN300", length: 856.0 },
    { spec: "DN250", length: 620.5 },
    { spec: "DN200", length: 540.2 },
    { spec: "DN150", length: 430.8 },
    { spec: "DN100", length: 380.0 },
    { spec: "DN80", length: 733.0 },
  ],
  排水: [
    { spec: "DN250", length: 520.3 },
    { spec: "DN200", length: 460.1 },
    { spec: "DN150", length: 380.6 },
    { spec: "DN100", length: 459.3 },
  ],
  气系统: [
    { spec: "DN80", length: 420.6 },
    { spec: "DN50", length: 380.2 },
    { spec: "DN40", length: 439.8 },
  ],
  透平油: [
    { spec: "DN50", length: 320.4 },
    { spec: "DN40", length: 260.1 },
    { spec: "DN32", length: 279.7 },
  ],
  消防水: [
    { spec: "DN100", length: 620.5 },
    { spec: "DN80", length: 480.2 },
    { spec: "DN65", length: 420.1 },
  ],
};

// 改造数据统计：按系统的改造次数
export const reformStatsBySystem = [
  { system: "技术供水", count: 6 },
  { system: "排水", count: 3 },
  { system: "气系统", count: 4 },
  { system: "透平油", count: 2 },
  { system: "消防水", count: 5 },
];

// 各系统改造明细（弹窗列表）：改造时间 / 改造资料
export const reformDetailsBySystem: Record<
  string,
  { time: string; title: string; material: string; unit: string }[]
> = {
  技术供水: [
    { time: "2026-03-15", title: "技术供水主管道扩容改造", material: "1#机组技术供水主管更换为 DN300 无缝钢管", unit: "1#机组" },
    { time: "2026-01-20", title: "技术供水泵变频改造", material: "1#~2#技术供水泵加装变频调速装置", unit: "1#2#机组" },
    { time: "2025-11-08", title: "滤水器自动排污改造", material: "技术供水滤水器改造为自动排污控制", unit: "全厂" },
    { time: "2025-08-30", title: "供水支管阀门更换", material: "分支管路 DN150 不锈钢阀门整体更换", unit: "1#机组" },
    { time: "2025-05-12", title: "冷却水循环管路改造", material: "机组冷却器进出水支管改造", unit: "2#机组" },
    { time: "2024-12-05", title: "技术供水系统管路改造", material: "供水母管防腐处理与局部更换", unit: "全厂" },
  ],
  排水: [
    { time: "2026-02-18", title: "厂房排水主管改造", material: "厂房排水主管 UPVC 管道更换", unit: "坝后厂房" },
    { time: "2025-09-25", title: "渗漏排水泵管路改造", material: "渗漏排水泵出口管路改造", unit: "1#机组" },
    { time: "2025-04-10", title: "排水支管疏通改造", material: "排水支管坡度调整与疏通", unit: "全厂" },
  ],
  气系统: [
    { time: "2026-05-06", title: "低压气系统管路改造", material: "低压气系统主管扩容改造", unit: "坝后厂房" },
    { time: "2026-02-11", title: "高压气储气罐管路改造", material: "储气罐连接管更换", unit: "全厂" },
    { time: "2025-10-22", title: "气系统阀门更换", material: "气系统主管阀门整体更换", unit: "1#机组" },
    { time: "2025-06-15", title: "制动气压管路改造", material: "机组制动气压管路改造", unit: "2#机组" },
  ],
  透平油: [
    { time: "2026-04-02", title: "透平油供油管路改造", material: "透平油供油主管更换为不锈钢管", unit: "1#机组" },
    { time: "2025-07-18", title: "油压装置管路改造", material: "油压装置进出油管路改造", unit: "2#机组" },
  ],
  消防水: [
    { time: "2026-06-20", title: "厂区消防主管改造", material: "厂区消防主管整体更换", unit: "厂区" },
    { time: "2026-03-28", title: "厂房消火栓管路改造", material: "厂房消火栓主管改造", unit: "坝后厂房" },
    { time: "2025-12-10", title: "消防水泵房管路改造", material: "消防水泵出水母管改造", unit: "全厂" },
    { time: "2025-08-05", title: "消防支管阀门更换", material: "消防分支管路阀门更换", unit: "1#机组" },
    { time: "2025-03-22", title: "消防水系统试压整改", material: "消防水系统管路试压与整改", unit: "全厂" },
  ],
};

// 技术供水系统用水量（m³）：年（最近12年 2015~2026）/ 月（最近12个月）/ 日（最近30天）
// date：时间维度的取值（用于选择器 value 与范围过滤）；label：图表横轴展示文本
export const waterUsageData: Record<
  "year" | "month" | "day",
  { date: string; label: string; value: number }[]
> = {
  year: [
    { date: "2015", label: "2015", value: 210.8 },
    { date: "2016", label: "2016", value: 205.6 },
    { date: "2017", label: "2017", value: 198.4 },
    { date: "2018", label: "2018", value: 192.8 },
    { date: "2019", label: "2019", value: 188.2 },
    { date: "2020", label: "2020", value: 196.5 },
    { date: "2021", label: "2021", value: 201.3 },
    { date: "2022", label: "2022", value: 194.7 },
    { date: "2023", label: "2023", value: 186.9 },
    { date: "2024", label: "2024", value: 181.2 },
    { date: "2025", label: "2025", value: 177.5 },
    { date: "2026", label: "2026", value: 176.4 },
  ],
  month: [
    { date: "2025-09", label: "2025-09", value: 171.2 },
    { date: "2025-10", label: "2025-10", value: 168.5 },
    { date: "2025-11", label: "2025-11", value: 166.3 },
    { date: "2025-12", label: "2025-12", value: 164.8 },
    { date: "2026-01", label: "2026-01", value: 163.2 },
    { date: "2026-02", label: "2026-02", value: 165.9 },
    { date: "2026-03", label: "2026-03", value: 169.6 },
    { date: "2026-04", label: "2026-04", value: 175.4 },
    { date: "2026-05", label: "2026-05", value: 181.3 },
    { date: "2026-06", label: "2026-06", value: 187.8 },
    { date: "2026-07", label: "2026-07", value: 190.6 },
    { date: "2026-08", label: "2026-08", value: 185.2 },
  ],
  day: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 6, 23 + i); // 2026-07-23 起 30 天
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${mm}-${dd}`,
      label: `${mm}-${dd}`,
      value: Number((5.9 + Math.sin(i / 4) * 1.3 + (i % 5) * 0.15).toFixed(1)),
    };
  }),
};

// 节点改造资料（Mock）：选中节点/设备后右侧"改造资料"卡片展示
export function generateReformRecords(
  node: TreeNodeData,
): { time: string; type: string; content: string; unit: string }[] {
  const unit = node.title;
  const pools = [
    { type: "技术改造", contents: ["设备整体更换升级", "关键部件改造"], time: "2026-03-18" },
    { type: "检修消缺", contents: ["大修后投运验证", "缺陷消除处理"], time: "2026-06-25" },
    { type: "设备改造", contents: ["控制回路优化改造", "自动化升级改造"], time: "2025-11-12" },
  ];
  return pools.map((pool, i) => ({
    time: pool.time,
    type: pool.type,
    content: `${unit}${pool.contents[i % pool.contents.length]}`,
    unit,
  }));
}
