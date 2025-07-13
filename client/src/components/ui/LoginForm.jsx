import React from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form';

const LoginForm = ({ onSubmit, isLoading }) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input 
                  placeholder="you@example.com" 
                  type="email" 
                  autoComplete="email"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...field} 
                  />
                </FormControl>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Remember me
                </FormLabel>
              </FormItem>
            )}
          />
          
          <a href="/forgot-password" className="text-sm font-medium text-orange-500 hover:text-orange-600">
            Forgot password?
          </a>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;