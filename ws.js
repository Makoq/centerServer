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
         console.log("新一轮--连接数:”",server.connections.length)
         console.log("当前消息",mssage)
         console.log("在线节点信息",currentOnlineNode)
         if(mssage.msg==='connlist'){//查看所有连接用户
            
            //过滤相同token的重复登录
            let flag=false
            for(let tk in currentOnlineNode){
                if(currentOnlineNode[tk]===mssage.msg){
                    currentOnlineNode[conn.key]=mssage.msg
                    
                    flag=true
                    break
                } 
            }
             
            if(!flag){
                currentOnlineNode[conn.key]=mssage.msg                
            }     
                
            // 获取链接token数组
            let ob={
                'list':[] 
            }            
            for(let c in currentOnlineNode){
                if(currentOnlineNode[c]=='connlist'){continue}
                ob.list.push(currentOnlineNode[c])
            } 
             console.log(currentOnlineNode)
            conn.sendText(JSON.stringify(ob))
         }else if(mssage.msg=='AvailablePcs'){//获取某个连接的所有可用处理服务
             
             
            // 请求节点
            if(mssage.req!=undefined){
                let off=false
                for(let con of server.connections){
                    if(conn==con) continue
                    
                    if(mssage.token===currentOnlineNode[con.key]){
                        
                        let avilablePcs={
                            msg:"AvbPcs",
                            token:mssage.token,
                            type:mssage.type
                        }
                        console.log("AvailablePcs",mssage.token)
                        con.sendText(JSON.stringify(avilablePcs))
                        off=true
                        break
                    }
                }
                if(!off){
                    conn.sendText("node offline")
                }   
            }else{
                console.log("to sdk",currentOnlineNode)
               //接收
                let resData={
                    res:'resData',
                    AvailablePcs:mssage.pcs
                }
                for(let con of server.connections){
                    console.log(con.key,currentOnlineNode[con.key])
                    if(conn==con) continue
                    // 找到sdk连接
                    if(currentOnlineNode[con.key]=='connlist'){
                        console.log('to sdk key:',con.key)
                        con.sendText(JSON.stringify(resData))
                        break    
                    }
                }
        
            }
            

         }
         else if(mssage.msg==="regist"){//用户注册
             
          //绑定连接与对应的容器和门户
          let flag=false
          for(let tk in currentOnlineNode){
             if(currentOnlineNode[tk]===mssage.token){
                 flag=true
                 break
             } 
          }
          if(!flag){
            currentOnlineNode[conn.key]=mssage.token
            
          } 
           console.log(mssage.token)
           conn.sendText("success");//注册成功
          
        }else if(mssage.msg==="req"||mssage.msg==="reqPcs"){//发出数据请求，来自门户
            //给我一个token,和一个数据id
    
            let off=true
             
            for(let con of server.connections){
                if(conn==con) continue
                if(con.readyState===3){
                    // con.sendText(JSON.stringify(reqData))
                }
                if(mssage.token===currentOnlineNode[con.key]){
                console.log(mssage.msg)
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

                    reqData['wsToken']=''+mssage.wsId    
                    con.sendText(JSON.stringify(reqData))
                    off=false
                    break
                }
               
            }
            if(off){
                //离线返回offline
                conn.sendText('node offline')
            }

        
            
        }else if(mssage.msg==="resdata"){//数据处理结果
		    console.log("trsponse data&connetction length",conn.key,server.connections.length)
		 
             for(let con of server.connections){
		 
                if(conn==con) continue
                
                if(mssage.wsToken===currentOnlineNode[con.key]){
			            console.log(mssage.msg,mssage.wsToken)
                        if(mssage.type!=undefined){//当无权限时的情况

                                if(mssage.type==='noAuthority'){
                                    con.sendText("no authority")
                                }else if(mssage.type==='db find err'){
                                    con.sendText("no data in service node!")
                                } 
                                
                        }else{
                                
                                if(mssage.stoutErr!=undefined){
                                    //处理方法执行出现问题
                                    let info={
                                        'msg':'pcsErr',
                                        'id':mssage.id,
                                        'reqUsr':mssage.reqUsr,
                                        'stoutErr':mssage.stoutErr
                                    }
                                    //返回给门户请求用户oid和数据下载id
                                    con.sendText(JSON.stringify(info))

                                }else{

                                    //结点在收到请求后，会把对应数据上传至数据容器，并返回下载数据的id
                                    let info={
                                        'msg':'insitudata',
                                        'id':mssage.id,
                                        'stout':mssage.stout,
                                        'reqUsr':mssage.reqUsr
                                    }
                                    //返回给门户请求用户oid和数据下载id
                                    con.sendText(JSON.stringify(info))
                                    console.log("insitu data",mssage.id,)

                                }
                            
                                
                        }
                       
                }
            }
        }else if(mssage.msg=='Migration'){
            //服务迁移，找到目标token节点
            let off=true
            for(let con of server.connections){
                if(conn==con) continue
                 
                if(mssage.targetToken===currentOnlineNode[con.key]){
                    let info={
                        msg:'MigRcv',
                        from:mssage.fromToken,
                        dataId:mssage.serviceDownloadId
                    }
                    console.log('Service Migration from:',mssage.fromToken,'target:',mssage.targetToken)
                    con.sendText(JSON.stringify(info))
                    let reply={
                        msg:'MigRcv',
                        reply:mssage.targetToken
                    }
                    conn.sendText(JSON.stringify(reply))
                    off=false
                    break
                }
            }

            if(off){
                let re={
                    msg:'MigRcv',
                    off:'node offline'
                }
                conn.sendText('node offline')
            }
        }
        
    });
    conn.on("close", function (code, reason) {
        let i=server.connections.indexOf(conn)
        server.connections.splice(1,i)
        delete currentOnlineNode[conn.key]
        console.log("关闭连接,当前连接数为：",server.connections.length)
    });
    conn.on("error", function (code, reason) {
        console.log("异常关闭，当前连接数为：",server.connections.length)
    });
}).listen(1708)
console.log("WebSocket建立完毕")
// process.on('uncaughtException', function (err) {
//   console.log('Caught Exception:' + err);//直接捕获method()未定义函数，Node进程未被退出。  
// });
  
