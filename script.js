// 游戏配置
const config = {
    gridSize: 20, // 网格大小
    speeds: {
        slow: 250,    // 慢速（毫秒）
        medium: 150,  // 中速（毫秒）
        fast: 80      // 快速（毫秒）
    },
    initialSpeed: 150, // 初始速度（毫秒）- 默认中速
    speedIncrement: 0, // 每吃一个食物增加的速度（设为0，因为现在由用户控制）
    minSpeed: 50 // 最小速度限制（最快）
};

// 游戏状态
const gameState = {
    snake: [], // 蛇的身体部分
    food: null, // 食物位置
    direction: 'right', // 初始方向
    nextDirection: 'right', // 下一个方向（防止在一个更新周期内多次改变方向）
    isRunning: false, // 游戏是否运行中
    isPaused: false, // 游戏是否暂停
    score: 0, // 分数
    speed: config.initialSpeed, // 当前速度
    gameLoop: null // 游戏循环的interval ID
};

// DOM 元素
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');

// 计算单元格大小
const cellSize = canvas.width / config.gridSize;

// 初始化游戏
function initGame() {
    // 创建蛇的初始身体
    gameState.snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    
    // 重置游戏状态
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.speed = getCurrentSpeedFromSlider(); // 从滑块获取当前速度
    gameState.isRunning = false;
    gameState.isPaused = false;
    
    // 更新分数显示
    updateScore();
    
    // 生成第一个食物
    generateFood();
    
    // 绘制初始状态
    draw();
}

// 开始游戏
function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        gameLoop();
    }
}

// 暂停游戏
function pauseGame() {
    if (gameState.isRunning && !gameState.isPaused) {
        gameState.isPaused = true;
        clearInterval(gameState.gameLoop);
    } else if (gameState.isRunning && gameState.isPaused) {
        gameState.isPaused = false;
        gameLoop();
    }
}

// 重新开始游戏
function restartGame() {
    clearInterval(gameState.gameLoop);
    initGame();
}

// 游戏主循环
function gameLoop() {
    // 清除之前的interval
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    // 设置新的interval
    gameState.gameLoop = setInterval(() => {
        update();
        draw();
    }, gameState.speed);
}

// 更新游戏状态
function update() {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    // 更新方向
    gameState.direction = gameState.nextDirection;
    
    // 获取蛇头
    const head = {...gameState.snake[0]};
    
    // 根据方向移动蛇头
    switch (gameState.direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= config.gridSize || head.y < 0 || head.y >= config.gridSize) {
        gameOver();
        return;
    }
    
    // 检查是否撞到自己
    for (let i = 0; i < gameState.snake.length; i++) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            gameOver();
            return;
        }
    }
    
    // 将新头部添加到蛇身体
    gameState.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 增加分数
        gameState.score += 10;
        updateScore();
        
        // 生成新食物
        generateFood();
        
        // 增加速度
        if (gameState.speed > config.minSpeed) {
            gameState.speed -= config.speedIncrement;
            // 更新游戏循环以应用新速度
            if (gameState.isRunning && !gameState.isPaused) {
                gameLoop();
            }
        }
    } else {
        // 如果没有吃到食物，移除尾部
        gameState.snake.pop();
    }
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        // 蛇头使用不同颜色
        if (index === 0) {
            ctx.fillStyle = '#4CAF50'; // 绿色蛇头
        } else {
            // 为蛇身创建渐变色
            const greenValue = Math.floor(150 - (index * 3));
            ctx.fillStyle = `rgb(0, ${Math.max(greenValue, 100)}, 0)`;
        }
        
        ctx.fillRect(
            segment.x * cellSize,
            segment.y * cellSize,
            cellSize,
            cellSize
        );
        
        // 添加边框使蛇的各部分更容易区分
        ctx.strokeStyle = '#222';
        ctx.strokeRect(
            segment.x * cellSize,
            segment.y * cellSize,
            cellSize,
            cellSize
        );
    });
    
    // 绘制食物
    if (gameState.food) {
        ctx.fillStyle = '#e74c3c'; // 红色食物
        ctx.beginPath();
        ctx.arc(
            gameState.food.x * cellSize + cellSize / 2,
            gameState.food.y * cellSize + cellSize / 2,
            cellSize / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // 如果游戏暂停，显示暂停文本
    if (gameState.isPaused) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('已暂停', canvas.width / 2, canvas.height / 2);
    }
}

// 生成食物
function generateFood() {
    // 创建一个可能的食物位置列表（排除蛇身所在位置）
    const availablePositions = [];
    
    for (let x = 0; x < config.gridSize; x++) {
        for (let y = 0; y < config.gridSize; y++) {
            // 检查此位置是否被蛇占用
            let isOccupied = false;
            for (const segment of gameState.snake) {
                if (segment.x === x && segment.y === y) {
                    isOccupied = true;
                    break;
                }
            }
            
            if (!isOccupied) {
                availablePositions.push({ x, y });
            }
        }
    }
    
    // 从可用位置中随机选择一个
    if (availablePositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        gameState.food = availablePositions[randomIndex];
    }
}

// 更新分数显示
function updateScore() {
    scoreElement.textContent = gameState.score;
}

// 游戏结束
function gameOver() {
    gameState.isRunning = false;
    clearInterval(gameState.gameLoop);
    
    // 创建游戏结束弹窗
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    gameOverDiv.style.display = 'flex';
    
    gameOverDiv.innerHTML = `
        <div class="game-over-content">
            <h2>游戏结束</h2>
            <p>你的分数: ${gameState.score}</p>
            <button id="play-again-btn">再玩一次</button>
        </div>
    `;
    
    document.body.appendChild(gameOverDiv);
    
    // 添加再玩一次按钮事件
    document.getElementById('play-again-btn').addEventListener('click', () => {
        document.body.removeChild(gameOverDiv);
        restartGame();
    });
}

// 键盘控制
document.addEventListener('keydown', (event) => {
    // 防止方向键滚动页面
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault();
    }
    
    // 只有在游戏运行时才处理方向键
    if (!gameState.isRunning || gameState.isPaused) return;
    
    // 根据按键更改方向（防止180度转弯）
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (gameState.direction !== 'down') {
                gameState.nextDirection = 'up';
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (gameState.direction !== 'up') {
                gameState.nextDirection = 'down';
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (gameState.direction !== 'right') {
                gameState.nextDirection = 'left';
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (gameState.direction !== 'left') {
                gameState.nextDirection = 'right';
            }
            break;
    }
});

// 获取当前滑块对应的速度值
function getCurrentSpeedFromSlider() {
    const sliderValue = parseInt(speedSlider.value);
    switch(sliderValue) {
        case 1:
            return config.speeds.slow;
        case 2:
            return config.speeds.medium;
        case 3:
            return config.speeds.fast;
        default:
            return config.speeds.medium;
    }
}

// 更新速度显示文本
function updateSpeedText() {
    const sliderValue = parseInt(speedSlider.value);
    switch(sliderValue) {
        case 1:
            speedValue.textContent = '慢速';
            break;
        case 2:
            speedValue.textContent = '中等';
            break;
        case 3:
            speedValue.textContent = '快速';
            break;
    }
}

// 更改游戏速度
function changeGameSpeed() {
    const newSpeed = getCurrentSpeedFromSlider();
    gameState.speed = newSpeed;
    
    // 如果游戏正在运行，更新游戏循环以应用新速度
    if (gameState.isRunning && !gameState.isPaused) {
        gameLoop();
    }
    
    // 更新速度显示文本
    updateSpeedText();
}

// 按钮事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);
speedSlider.addEventListener('input', changeGameSpeed);

// 初始化游戏
updateSpeedText(); // 初始化速度显示文本
initGame();