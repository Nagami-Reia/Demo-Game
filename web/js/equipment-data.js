export const EQUIPMENT_ITEMS = {
 coin:{name:'一枚硬币',flavor:'不知道是谁掉在地上的。',text:'下一轮拨款时 +€1，一次性。',kind:'cash',amount:1,price:2,rarity:'common'},
 note:{name:'一张便利贴',flavor:'刚刚谁说这事已经记下来了？',text:'选择一个关联盟约，直接 +1 层。',kind:'layers',amount:1,price:1,rarity:'common'},
 directory:{name:'党团通讯录',flavor:'拨三个分机，终于找到了对的人。',text:'选择关联盟约 +3 层，已激活时 +5 层。',kind:'layers',amount:3,active:5,price:5,rarity:'uncommon'},
 minutes:{name:'一份会议纪要',flavor:'秘书处这次居然赶在散会前发了。',text:'选择关联工作组盟约，直接 +5 层。',kind:'layers',amount:5,category:'working_group',price:7,rarity:'rare'},
 badge:{name:'联邦党代会代表证',flavor:'绳子还是上一届的。',text:'选择关联组织盟约 +5 层，已激活时 +8 层。',kind:'layers',amount:5,active:8,route:'organizational_majority',price:8,rarity:'rare'},
 archive:{name:'州党部档案柜',flavor:'第二格抽屉只有从左边才能打开。',text:'选择关联州盟约，直接 +8 层。',kind:'layers',amount:8,category:'state',price:10,rarity:'special'},
 legal:{name:'法律意见书',flavor:'结论在第十七页，保留意见在第十八页。',text:'常驻 · 装备者专业修正 +0.30。',kind:'gear',action:'amend',amount:.30,price:5,rarity:'uncommon'},
 coffee:{name:'咖啡机',flavor:'第三次开会之后才有人想起来接水。',text:'常驻 · 装备者协调 +0.20。',kind:'gear',action:'coordinate',amount:.20,price:4,rarity:'common'},
 speech:{name:'修改过的讲稿',flavor:'最后一页还是昨天打印的。',text:'常驻 · 协调 +0.20。Merz 装备且「组织多数」激活时，协调再 +0.55。',kind:'gear',action:'coordinate',amount:.20,exclusive:'Merz',bonus:.55,route:'organizational_majority',price:9,rarity:'special'}
};
