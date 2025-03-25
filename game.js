// 游戏配置
const config = {
    gridSize: 20,          // 网格大小
    initialSpeed: 200,     // 初始速度（毫秒/移动）
    speedIncrease: 10,     // 每次加速减少的毫秒数
    speedUpScore: 50,      // 每得多少分加速一次
    foodColor: '#ff0000',  // 食物颜色
    snakeColors: {         // 蛇的颜色配置
        head: '#00CED1',   // 蛇头颜色（青绿色）
        body1: '#4CAF50',  // 蛇身第一种颜色（浅绿色）
        body2: '#2E7D32'   // 蛇身第二种颜色（深绿色）
    },
    snakeSizes: {         // 蛇的尺寸配置
        head: 18,         // 蛇头大小（相对于网格的比例）
        body: 16          // 蛇身大小（相对于网格的比例）
    }
};

// 跟踪上次空格键按下的时间
let lastSpaceKeyTime = 0;

// 游戏状态
let gameState = {
    snake: [],            // 蛇的身体部分
    food: null,           // 食物位置
    direction: 'right',   // 当前移动方向
    nextDirection: 'right', // 下一个移动方向
    score: 0,             // 当前分数
    highScore: localStorage.getItem('snakeHighScore') || 0, // 最高分
    gameLoop: null,       // 游戏循环计时器
    isPaused: false,      // 游戏是否暂停
    speed: config.initialSpeed, // 当前速度
    isGameOver: true      // 游戏是否结束
};

// 获取 Canvas 上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 添加触摸事件支持
let touchStartX = 0;
let touchStartY = 0;

// 添加触摸事件监听器
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchmove', handleTouchMove, false);
canvas.addEventListener('touchend', handleTouchEnd, false);

// 处理触摸开始事件
function handleTouchStart(event) {
    event.preventDefault(); // 防止页面滚动
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

// 处理触摸移动事件
function handleTouchMove(event) {
    event.preventDefault(); // 防止页面滚动
    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;
    
    // 计算滑动方向
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // 判断滑动方向（水平滑动距离大于垂直滑动距离时才改变方向）
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && gameState.direction !== 'left') {
            gameState.nextDirection = 'right';
        } else if (deltaX < 0 && gameState.direction !== 'right') {
            gameState.nextDirection = 'left';
        }
    } else {
        if (deltaY > 0 && gameState.direction !== 'up') {
            gameState.nextDirection = 'down';
        } else if (deltaY < 0 && gameState.direction !== 'down') {
            gameState.nextDirection = 'up';
        }
    }
    
    // 更新起始点
    touchStartX = touchEndX;
    touchStartY = touchEndY;
}

// 处理触摸结束事件
function handleTouchEnd(event) {
    event.preventDefault(); // 防止页面滚动
}

// 初始化游戏
function initGame() {
    // 初始化蛇的位置（从中间开始）
    const centerX = Math.floor(canvas.width / (2 * config.gridSize));
    const centerY = Math.floor(canvas.height / (2 * config.gridSize));
    gameState.snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
    ];
    
    // 生成第一个食物
    generateFood();
    
    // 重置游戏状态
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.speed = config.initialSpeed; // 确保速度重置为初始值
    gameState.isPaused = false;
    gameState.isGameOver = false;
    
    // 更新分数显示
    updateScore();
    
    // 清除旧的游戏循环并以初始速度开始新的循环
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    gameState.gameLoop = setInterval(gameLoop, config.initialSpeed); // 使用初始速度而不是 gameState.speed
}

// 生成食物
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / config.gridSize)),
            y: Math.floor(Math.random() * (canvas.height / config.gridSize))
        };
    } while (isCollisionWithSnake(newFood));
    gameState.food = newFood;
}

// 检查是否与蛇身碰撞
function isCollisionWithSnake(position) {
    return gameState.snake.some(segment => 
        segment.x === position.x && segment.y === position.y
    );
}

// 更新游戏状态
function gameLoop() {
    if (gameState.isPaused) return;
    
    // 获取蛇头位置
    const head = { ...gameState.snake[0] };
    
    // 更新方向
    gameState.direction = gameState.nextDirection;
    
    // 根据方向移动蛇头
    switch (gameState.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // 检查碰撞
    if (isGameOver(head)) {
        endGame();
        return;
    }
    
    // 移动蛇
    gameState.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 增加分数
        gameState.score += 10;
        updateScore();
        
        // 检查是否需要加速
        if (gameState.score % config.speedUpScore === 0) {
            increaseSpeed();
        }
        
        // 生成新食物
        generateFood();
    } else {
        // 如果没有吃到食物，移除蛇尾
        gameState.snake.pop();
    }
    
    // 重绘游戏画面
    draw();
}

// 检查游戏是否结束
function isGameOver(head) {
    // 如果没有传入头部位置，说明游戏还未开始
    if (!head) return false;
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= canvas.width / config.gridSize ||
        head.y < 0 || head.y >= canvas.height / config.gridSize) {
        return true;
    }
    
    // 检查是否撞到自己
    return isCollisionWithSnake(head);
}

// 增加游戏速度
function increaseSpeed() {
    gameState.speed = Math.max(50, gameState.speed - config.speedIncrease);
    clearInterval(gameState.gameLoop);
    gameState.gameLoop = setInterval(gameLoop, gameState.speed);
}

// 更新分数显示
function updateScore() {
    document.getElementById('current-score').textContent = gameState.score;
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('snakeHighScore', gameState.highScore);
        document.getElementById('high-score').textContent = gameState.highScore;
    }
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制食物
    ctx.fillStyle = config.foodColor;
    ctx.beginPath();
    ctx.arc(
        (gameState.food.x + 0.5) * config.gridSize,
        (gameState.food.y + 0.5) * config.gridSize,
        config.gridSize / 2.5,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        // 计算圆心位置
        const centerX = (segment.x + 0.5) * config.gridSize;
        const centerY = (segment.y + 0.5) * config.gridSize;
        
        ctx.beginPath();
        if (index === 0) {
            // 绘制蛇头（较大的圆形）
            ctx.fillStyle = config.snakeColors.head;
            ctx.arc(
                centerX,
                centerY,
                config.snakeSizes.head / 2,
                0,
                Math.PI * 2
            );
        } else {
            // 绘制蛇身（交替颜色的小圆形）
            ctx.fillStyle = index % 2 === 1 ? config.snakeColors.body1 : config.snakeColors.body2;
            ctx.arc(
                centerX,
                centerY,
                config.snakeSizes.body / 2,
                0,
                Math.PI * 2
            );
        }
        ctx.fill();
        
        // 为每个部分添加高光效果
        ctx.beginPath();
        const highlightRadius = index === 0 ? config.snakeSizes.head / 6 : config.snakeSizes.body / 6;
        const highlightOffset = index === 0 ? config.snakeSizes.head / 4 : config.snakeSizes.body / 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.arc(
            centerX - highlightOffset,
            centerY - highlightOffset,
            highlightRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

// 游戏结束处理
function endGame() {
    clearInterval(gameState.gameLoop);
    gameState.isGameOver = true;
    showMessage(`游戏结束！得分：${gameState.score}`);
}

// 显示消息
function showMessage(text) {
    const message = document.createElement('div');
    message.className = 'game-message';
    message.textContent = text;
    document.querySelector('.game-container').appendChild(message);
    message.style.display = 'block';
}

// 隐藏消息
function hideMessage() {
    const message = document.querySelector('.game-message');
    if (message) {
        message.remove();
    }
}

// 键盘事件处理
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    
    // 处理方向键
    const directions = {
        'arrowup': 'up',
        'arrowdown': 'down',
        'arrowleft': 'left',
        'arrowright': 'right',
        'w': 'up',
        's': 'down',
        'a': 'left',
        'd': 'right'
    };
    
    if (key in directions) {
        const newDirection = directions[key];
        // 防止直接反向移动
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        if (opposites[newDirection] !== gameState.direction) {
            gameState.nextDirection = newDirection;
        }
    }
    
    // 处理空格键（暂停/继续）
    if (key === ' ') {
        // 防止空格键重复触发（限制最小间隔为200毫秒）
        const currentTime = Date.now();
        if (currentTime - lastSpaceKeyTime > 200) {
            lastSpaceKeyTime = currentTime;
            togglePause();
        }
        // 阻止空格键的默认行为（页面滚动）
        event.preventDefault();
    }
});

// 添加 keyup 事件监听器来防止持续触发
document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === ' ') {
        event.preventDefault();
    }
});

// 暂停/继续游戏
function togglePause() {
    if (gameState.isGameOver) return; // 如果游戏已结束，不处理暂停

    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        clearInterval(gameState.gameLoop);
        gameState.gameLoop = null;
        showMessage('游戏暂停');
    } else {
        if (!gameState.gameLoop) {
            gameState.gameLoop = setInterval(gameLoop, gameState.speed);
        }
        hideMessage();
    }
}

// 窗口失去焦点时暂停游戏
window.addEventListener('blur', () => {
    if (!gameState.isPaused) {
        togglePause();
    }
});

// 设置按钮事件监听
document.getElementById('startButton').addEventListener('click', () => {
    hideMessage();
    if (gameState.isGameOver) {
        // 只有在游戏结束时才初始化新游戏
        initGame();
    } else if (gameState.isPaused) {
        // 如果游戏暂停，则继续游戏
        togglePause();
    }
});

document.getElementById('rulesButton').addEventListener('click', () => {
    showMessage(
        '游戏规则：\n' +
        '1. 使用方向键或WASD控制蛇的移动\n' +
        '2. 吃到食物得10分\n' +
        '3. 撞墙或撞到自己游戏结束\n' +
        '4. 按空格键暂停/继续游戏'
    );
}); 