import { useState, useCallback, useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useAnchorWallet } from '@solana/wallet-adapter-react'
import * as anchor from '@project-serum/anchor'
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey.js'
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { SystemProgram } from '@solana/web3.js'
import { toast } from 'react-hot-toast'
import { TODO_PROGRAM_PUBKEY } from '../constants'
import { IDL as todoIdl } from '../constants/idl'
import { authorFilter } from '../utils'

export function useTodo() {
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const anchorWallet = useAnchorWallet()

    const [initialized, setInitialized] = useState(false)
    const [lastTodo, setLastTodo] = useState(0)
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(false)
    const [transactionPending, setTransactionPending] = useState(false)
    const [input, setInput] = useState('')

    const program = useMemo(() => {
        if (anchorWallet) {
            const provider = new anchor.AnchorProvider(connection, anchorWallet, anchor.AnchorProvider.defaultOptions())
            return new anchor.Program(todoIdl, TODO_PROGRAM_PUBKEY, provider)
        }
        return null
    }, [connection, anchorWallet])

    // Fetch todos
    const fetchTodos = useCallback(async () => {
        if (!program || !publicKey) return

        setLoading(true)
        try {
            const [profilePda] = findProgramAddressSync(
                [utf8.encode('USER_STATE'), publicKey.toBuffer()],
                program.programId
            )
            const profileAccount = await program.account.userProfile.fetchNullable(profilePda)

            if (profileAccount) {
                setInitialized(true)
                setLastTodo(profileAccount.lastTodo)

                const todoAccounts = await program.account.todoAccount.all([authorFilter(publicKey.toString())])
                setTodos(todoAccounts)
            } else {
                setInitialized(false)
                setTodos([])
            }
        } catch (error) {
            console.error(error)
            setInitialized(false)
            setTodos([])
        } finally {
            setLoading(false)
        }
    }, [program, publicKey])

    // Initialize user
    const initializeUser = async () => {
        if (!program || !publicKey) return;
        if (initialized) {
            toast('User already initialized!');
            return;
        }

        setTransactionPending(true)
        try {
            const [profilePda] = findProgramAddressSync(
                [utf8.encode('USER_STATE'), publicKey.toBuffer()],
                program.programId
            )

            await program.methods.initializeUser()
                .accounts({
                    userProfile: profilePda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()

            toast.success('Successfully initialized user.')
            await fetchTodos()
        } catch (error) {
            console.error(error)
            toast.error(error.toString())
        } finally {
            setTransactionPending(false)
        }
    }

    // Handle input change
    const handleChange = (e) => {
        setInput(e.target.value)  // Update input on change
    }

    // Add new todo
    const addTodo = async () => { 
        if (!program || !publicKey || !input) return

        setTransactionPending(true)
        try {
            const [profilePda] = findProgramAddressSync(
                [utf8.encode('USER_STATE'), publicKey.toBuffer()],
                program.programId
            )
            const [todoPda] = findProgramAddressSync(
                [utf8.encode('TODO_STATE'), publicKey.toBuffer(), Uint8Array.from([lastTodo])],
                program.programId
            )

            await program.methods.addTodo(input)  // Pass the input value to the method
                .accounts({
                    userProfile: profilePda,
                    todoAccount: todoPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()

            toast.success('Successfully added todo.')
            setInput('')  // Clear input after adding todo
            await fetchTodos()
        } catch (error) {
            console.error(error)
            toast.error(error.toString())
        } finally {
            setTransactionPending(false)
        }
    }

    // Mark todo as complete
    const markTodo = async (todoPda, todoIdx) => {
        if (!program || !publicKey) return

        setTransactionPending(true)
        try {
            const [profilePda] = findProgramAddressSync(
                [utf8.encode('USER_STATE'), publicKey.toBuffer()],
                program.programId
            )

            await program.methods.markTodo(todoIdx)
                .accounts({
                    userProfile: profilePda,
                    todoAccount: todoPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()

            toast.success('Successfully marked todo.')
            await fetchTodos()
        } catch (error) {
            console.error(error)
            toast.error(error.toString())
        } finally {
            setTransactionPending(false)
        }
    }

    // Remove todo
    const removeTodo = async (todoPda, todoIdx) => {
        if (!program || !publicKey) return

        setTransactionPending(true)
        try {
            const [profilePda] = findProgramAddressSync(
                [utf8.encode('USER_STATE'), publicKey.toBuffer()],
                program.programId
            )

            await program.methods.removeTodo(todoIdx)
                .accounts({
                    userProfile: profilePda,
                    todoAccount: todoPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()

            toast.success('Successfully removed todo.')
            await fetchTodos()
        } catch (error) {
            console.error(error)
            toast.error(error.toString())
        } finally {
            setTransactionPending(false)
        }
    }

    // Memoized incomplete and completed todos
    const incompleteTodos = useMemo(() => todos.filter(todo => !todo.account.marked), [todos])
    const completedTodos = useMemo(() => todos.filter(todo => todo.account.marked), [todos])

    return {
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
        handleChange,
        fetchTodos,
    };
}

export default useTodo
