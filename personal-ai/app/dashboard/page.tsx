"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Lock, Sparkles } from "lucide-react";

export default function Dashboard(){
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    const initDatabase = async (): Promise<void> => {
      try {
        await fetch("/api/init-db");
      } catch (error) {
        console.error("Database initialization error:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initDatabase();
  }, []);

  if (!isLoaded || isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const tools = [
    {
      id: "question-generator",
      title: "Question Generator",
      description:
        "Generate interview-grade questions using AI for any technical topic",
      icon: Brain,
      available: true,
      route: "/tools/question-generator",
    },
    {
      id: "code-reviewer",
      title: "Code Reviewer",
      description: "AI-powered code review",
      icon: Sparkles,
      available: false,
      route: null,
    },
    {
      id: "mock-interviewer",
      title: "Mock Interviewer",
      description: "Practice interviews with AI",
      icon: Lock,
      available: false,
      route: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Hub</h1>
            <p className="text-sm text-gray-600">AI-Powered Interview Preparation</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.firstName || 'User'}</p>
              <p className="text-xs text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.firstName}! 👋</h2>
          <p className="text-gray-600">Select a tool to get started with your interview preparation</p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Card 
                key={tool.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  tool.available ? 'cursor-pointer' : 'opacity-60'
                }`}
                onClick={() => tool.available && router.push(tool.route)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {!tool.available && (
                      <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tool.available ? (
                    <Button className="w-full" variant="default">
                      Launch Tool
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}