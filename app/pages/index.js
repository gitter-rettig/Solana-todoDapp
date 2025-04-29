import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useTodo } from '../hooks/useTodo'
import Loading from '../components/Loading'
import TodoSection from '../components/todo/TodoSection'
import styles from '../styles/Home.module.css'

const Home = () => {
    const {
        initialized,
        initializeUser,
        loading,
        transactionPending,
        completedTodos,
        incompleteTodos,
        addTodo,
        markTodo,
        removeTodo,
        input,
        handleChange
    } = useTodo();

    const handleAddTodo = (e) => {
        e.preventDefault();
        if (input.trim().length === 0) return; // Prevent empty todos
        addTodo();
    };

    return (
        <div className={styles.container}>
            <div className={styles.actionsContainer}>
                {initialized ? (
                    <div className={styles.todoInput}>
                        <div className={`${styles.todoCheckbox} ${styles.checked}`} />
                        <div className={styles.inputContainer}>
                            <form onSubmit={(e) => { 
                                e.preventDefault()
                                addTodo()  // Trigger addTodo when form is submitted
                            }}>
                                <input 
                                    value={input} 
                                    onChange={handleChange}  // Update input state on change
                                    id={styles.inputField} 
                                    type="text" 
                                    placeholder="Create a new todo..." 
                                />
                            </form>
                        </div>
                    </div>
                ) : (
                    <button 
                        type="button" 
                        className={styles.button} 
                        onClick={() => initializeUser()} 
                        disabled={transactionPending}
                    >
                        Initialize
                    </button>
                )}
                <WalletMultiButton /> 
            </div>

            <div className={styles.mainContainer}>
                <Loading loading={loading}>
                    <TodoSection 
                        title="Tasks" 
                        todos={incompleteTodos} 
                        action={markTodo} 
                    />
                    <TodoSection 
                        title="Completed" 
                        todos={completedTodos} 
                        action={removeTodo} 
                    />
                </Loading>
            </div>
        </div>
    )
}

export default Home
