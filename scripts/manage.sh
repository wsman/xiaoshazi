#!/bin/bash
# xiaoshazi 服务管理脚本

NAME="xiaoshazi"
PORT=14514
NODE_BIN="/home/wsman/.nvm/versions/node/v22.22.0/bin/node"
APP_DIR="/home/wsman/桌面/Coding Task/xiaoshazi"
LOG_FILE="/var/log/xiaoshazi.log"

start() {
    echo "启动 $NAME..."
    cd $APP_DIR
    nohup $NODE_BIN server.js > $LOG_FILE 2>&1 &
    echo "$NAME 已启动 (PID: $!)"
}

stop() {
    echo "停止 $NAME..."
    pkill -f "node server.js"
    echo "$NAME 已停止"
}

restart() {
    stop
    sleep 2
    start
}

status() {
    if pgrep -f "node server.js" > /dev/null; then
        echo "$NAME 正在运行"
    else
        echo "$NAME 未运行"
    fi
}

case "$1" in
    start) start ;;
    stop) stop ;;
    restart) restart ;;
    status) status ;;
    *) echo "用法: $0 {start|stop|restart|status}" ;;
esac
