import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface SignInForm {
  email: string
  password: string
}

interface SignUpForm {
  email: string
  password: string
  fullName: string
  confirmPassword: string
}

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  
  const signInForm = useForm<SignInForm>()
  const signUpForm = useForm<SignUpForm>()
  
  const handleSignIn = async (data: SignInForm) => {
    setLoading(true)
    try {
      await signIn(data.email, data.password)
      toast.success('Signed in successfully!')
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        navigate(redirectTo)
      }, 100)
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignUp = async (data: SignUpForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    setLoading(true)
    try {
      await signUp(data.email, data.password, data.fullName)
      toast.success('Account created successfully!')
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        navigate(redirectTo)
      }, 100)
    } catch (error: any) {
      toast.error(error.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card>
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-gray-900">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-gray-600 mt-2">
                {isSignUp 
                  ? 'Join our community of craft lovers'
                  : 'Welcome back to Craftly'
                }
              </p>
            </div>
            
            {isSignUp ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-6">
                <Input
                  label="Full Name"
                  type="text"
                  {...signUpForm.register('fullName', { 
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Full name must be at least 2 characters'
                    }
                  })}
                  error={signUpForm.formState.errors.fullName?.message}
                />
                <Input
                  label="Email"
                  type="email"
                  {...signUpForm.register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Invalid email address'
                    }
                  })}
                  error={signUpForm.formState.errors.email?.message}
                />
                <Input
                  label="Password"
                  type="password"
                  {...signUpForm.register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  error={signUpForm.formState.errors.password?.message}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  {...signUpForm.register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: (value) => value === signUpForm.watch('password') || 'Passwords do not match'
                  })}
                  error={signUpForm.formState.errors.confirmPassword?.message}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Create Account
                </Button>
              </form>
            ) : (
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  {...signInForm.register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Invalid email address'
                    }
                  })}
                  error={signInForm.formState.errors.email?.message}
                />
                <Input
                  label="Password"
                  type="password"
                  {...signInForm.register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 1,
                      message: 'Password is required'
                    }
                  })}
                  error={signInForm.formState.errors.password?.message}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Sign In
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}