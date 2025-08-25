import { Input } from "@/components/ui/input";
import AuthLayout from "./AuthLayout";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import LogoLarge from "@/components/logo-large";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import authSchema from "@/lib/schema/auth-schema";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import axios from "axios";

const formSchema = authSchema.extend({
  first_name: z.string().min(1, "Please enter your first name"),
  last_name: z.string().min(1, "Please enter your last name"),
  confirm_password: z.string().min(1, "Please confirm your password"),
});

const rootUrl = `${import.meta.env.VITE_API_URL}/${
  import.meta.env.VITE_API_VERSION
}`;

export default function Signup() {
  // Navigate

  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.password !== values.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const result = await axios.post(
        `${rootUrl}/users/`,
        {
          email: values.email,
          password: values.password,
          firstName: values.first_name,
          lastName: values.last_name,
        },
        {
          withCredentials: true,
        }
      );

      if (result.status === 200) {
        navigate("/");
      }
    } catch (error) {
      console.log(error);
      toast.error("An error occured while signing you up.");
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${rootUrl}/auth/google`;
  };

  return (
    <AuthLayout>
      <div className="md:w-[400px] p-4">
        <LogoLarge />
        <h1 className="font-medium mb-4 text-center">Sign-up</h1>
        <div className="flex flex-col gap-2">
          <Form {...form}>
            <form
              className="flex flex-col gap-2"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Input placeholder="Email" {...field} />
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <Input placeholder="First name" {...field} />
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <Input placeholder="Last name" {...field} />
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Input placeholder="Password" type="password" {...field} />
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <Input
                      placeholder="Confirm Password"
                      type="password"
                      {...field}
                    />
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button type="submit">Sign-up</Button>
            </form>
          </Form>
          <p className="text-center mt-4 mb-2 text-sm font-medium text-neutral-500">
            Or
          </p>
          {/* Google Sign-up */}
          <Button
            variant={"outline"}
            type="button"
            onClick={handleGoogleSignup}
          >
            <GoogleIcon />
            Sign-up with Google
          </Button>
          <div className="flex flex-col items-center gap-2 mb-3">
            <Link to={"#"} className="text-xs">
              Forgot password
            </Link>
            <p className="text-xs text-neutral-500">
              Already have an account?{" "}
              <Link to={"/sign-in"} className="text-blue-500">
                Sign-in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
