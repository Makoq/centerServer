var ws = require("nodejs-websocket");
console.log("开始建立连接...")

var currentOnlineNode={} 
var server = ws.createServer(function(conn){
  
    conn.on("text", function (msg) {
        let mssage
         if(msg==='online'){
             return
         }
        mssage=JSON.parse(msg)
        console.log(server.connections.length)
     
        if(mssage.msg==="regist"){//用户注册
             
          //绑定连接与对应的容器和门户
            currentOnlineNode[conn.key]=mssage.token
	console.log(mssage.token)
            conn.sendText("success");//注册成功

        }else if(mssage.msg==="req"||mssage.msg==="reqPcs"){//发出数据请求，来自门户
            //给我一个token,和一个数据id
    
            let off=true
             
            for(let con of server.connections){
                if(conn==con) continue
                if(con.readyState===3){
                    con.sendText(JSON.stringify(reqData))
                }
                if(mssage.token===currentOnlineNode[con.key]){
	console.log(mssage.msg,mssage.wsId)
                   if(mssage.msg==="req"){
                        var reqData={
                            'req':true,
                            'id':mssage.id,
                            'name':mssage.name,
                            'token':mssage.token,
                            'reqUsrOid':mssage.reqUsrOid
                        }
                    }else if(mssage.msg==="reqPcs"){
                        var reqData={
                            'reqPcs':true,
                            'pcsId':mssage.pcsId,
                            'dataId':mssage.dataId,
                            'name':mssage.name,
                            'token':mssage.token,
                            'reqUsrOid':mssage.reqUsrOid,
                            'params':mssage.params
                        }
                    }
	    reqData['wsToken']=mssage.wsId
                    con.sendText(JSON.stringify(reqData))
                    off=false
                    break
                }
               
            }
            if(off){
                //离线返回offline
                conn.sendText('node offline')
            }

        
            
        }else if(mssage.msg==="resdata"){
             for(let con of server.connections){
                if(conn==con) continue
                if(con.readyState===3){
                    con.sendText(JSON.stringify(reqData))
                }
                
                if(mssage.wsToken===currentOnlineNode[con.key]){
	console.log(mssage.msg,mssage.wsToken)
                        if(mssage.type!=undefined){//当无权限时的情况

                                if(mssage.type==='noAuthority'){
                                    con.sendText("no authority")
                                }else if(mssage.type==='db find err'){
                                    con.sendText("no data in service node!")
                                }
                                
                        }else{

                                //结点在收到请求后，会把对应数据上传至数据容器，并返回下载数据的id
                                let info={
                                    'msg':'insitudata',
                                    'id':mssage.id,
                                    'reqUsr':mssage.reqUsr
                                }
                                //返回给门户请求用户oid和数据下载id
                                con.sendText(JSON.stringify(info))
                                console.log("insitu data",mssage.id,)
                            }
                        
                }
            }
        }
        
    });
    conn.on("close", function (code, reason) {
        let i=server.connections.indexOf(conn)
        server.connections.splice(1,i)
        
        console.log("关闭连接")
    });
    conn.on("error", function (code, reason) {
        console.log("异常关闭")
    });
}).listen(1708)
console.log("WebSocket建立完毕")
process.on('uncaughtException', function (err) {
  console.log('Caught Exception:' + err);//直接捕获method()未定义函数，Node进程未被退出。  
});
  