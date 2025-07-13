import React from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './form';

const RegisterForm = ({ onSubmit, isLoading }) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John" 
                    autoComplete="given-name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Doe" 
                    autoComplete="family-name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
                    autoComplete="new-password"
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
              <FormDescription>
                Password must be at least 8 characters long.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...field} 
                  />
                </FormControl>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
        
        <FormField
          control={form.control}
          name="agreeTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-2 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the{' '}
                  <a href="/terms" className="text-orange-500 hover:text-orange-600">
                    terms of service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-orange-500 hover:text-orange-600">
                    privacy policy
                  </a>
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;