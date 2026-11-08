export const EQUIPMENT_ITEMS = {
 coin:{name:'一枚硬币',flavor:'不知道是谁掉在地上的。',text:'下一轮拨款时 +€1，一次性。',kind:'cash',amount:1,price:2,rarity:'common'},
 note:{name:'一张便利贴',flavor:'刚刚谁说这事已经记下来了？',text:'选择一个关联盟约，直接 +1 层。',kind:'layers',amount:1,price:1,rarity:'common'},
 directory:{name:'党团通讯录',flavor:'有些号码已经停机。',kind:'gear',price:2,rarity:'uncommon',rates:{negotiate:[.15,.25]}},
 directory_legacy:{name:'党团通讯录（旧版）',flavor:'拨三个分机，终于找到了对的人。',text:'选择关联盟约 +3 层，已激活时 +5 层。',kind:'layers',amount:3,active:5,price:5,rarity:'uncommon',retired:true},
 minutes:{name:'一份会议纪要',flavor:'秘书处这次居然赶在散会前发了。',text:'选择关联工作组盟约，直接 +5 层。',kind:'layers',amount:5,category:'working_group',price:7,rarity:'rare'},
 badge:{name:'联邦党代会代表证',flavor:'绳子还是上一届的。',text:'选择关联组织盟约 +5 层，已激活时 +8 层。',kind:'layers',amount:5,active:8,route:'organizational_majority',price:8,rarity:'rare'},
 archive:{name:'州党部档案柜',flavor:'第二格抽屉只有从左边才能打开。',text:'选择关联州盟约，直接 +8 层。',kind:'layers',amount:8,category:'state',price:10,rarity:'special'},
 legal:{name:'法律意见书',flavor:'结论见第八十七页。',kind:'gear',price:2,rarity:'uncommon',rates:{scrutinize:[.20,.35]}},
 coffee:{name:'咖啡机',flavor:'仍然是本机构最可靠的设备。',kind:'gear',price:2,rarity:'common',rates:{coordinate:[.15,.25]}},
 budget_amendment:{name:'预算修正案',flavor:'财政部表示反对。',kind:'gear',price:2,rarity:'uncommon',rates:{amend:[.20,.35]}},
 work_phone:{name:'第二部工作手机',flavor:'第一部还在响。',kind:'gear',price:3,rarity:'uncommon',rates:{negotiate:[.20,.35],coordinate:[-.10,-.10]}},
 unread_files:{name:'一叠未读文件',flavor:'请于今日下班前阅毕。',kind:'gear',price:2,rarity:'uncommon',rates:{scrutinize:[.30,.50],negotiate:[-.10,-.10]}},
 flag_pin:{name:'国旗胸针',flavor:'联邦财产，似乎。',kind:'gear',price:2,rarity:'common',rates:{negotiate:[.05,.10],coordinate:[.05,.10],amend:[.05,.10],scrutinize:[.05,.10]}},
 briefcase:{name:'一只公文包',flavor:'内容物不予公开。不过他们可能希望你拍翻包短视频。',kind:'gear',price:2,rarity:'common',rates:{amend:[.15,.25],scrutinize:[.10,.15]}},
 speech:{name:'修改过的讲稿',flavor:'最后一页还是昨天打印的。',text:'常驻 · 协调 +0.20。Merz 装备且「组织多数」激活时，协调再 +0.55。',kind:'gear',action:'coordinate',amount:.20,exclusive:'Merz',bonus:.55,route:'organizational_majority',price:9,rarity:'special'}
};
