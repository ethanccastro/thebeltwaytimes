export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface AboutInfo {
  title: string;
  description: string;
  features: string[];
  team: Array<{
    name: string;
    role: string;
    bio: string;
  }>;
}

export class HomeService {
  /**
   * Get welcome message for the home page
   */
  public getWelcomeMessage(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good morning! Welcome to our TypeScript project.';
    } else if (hour < 18) {
      return 'Good afternoon! Welcome to our TypeScript project.';
    } else {
      return 'Good evening! Welcome to our TypeScript project.';
    }
  }

  /**
   * Get current time in a formatted string
   */
  public getCurrentTime(): string {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  }

  /**
   * Get about page information
   */
  public getAboutInfo(): AboutInfo {
    return {
      title: 'About Our TypeScript Project',
      description: 'A modern, scalable TypeScript application built with best practices and comprehensive tooling.',
      features: [
        'TypeScript 5.3 with strict configuration',
        'Express.js web framework',
        'EJS templating engine',
        'Jest testing framework',
        'ESLint and Prettier for code quality',
        'Session-based authentication',
        'MVC architecture pattern',
        'Comprehensive error handling'
      ],
      team: [
        {
          name: 'John Doe',
          role: 'Lead Developer',
          bio: 'Full-stack developer with 5+ years of experience in TypeScript and Node.js.'
        },
        {
          name: 'Jane Smith',
          role: 'Frontend Developer',
          bio: 'Specialized in modern web technologies and user experience design.'
        },
        {
          name: 'Mike Johnson',
          role: 'Backend Developer',
          bio: 'Expert in server-side development and database optimization.'
        }
      ]
    };
  }

  /**
   * Process contact form submission
   */
  public async processContactForm(data: ContactFormData): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }

      // Here you would typically save to database or send email

      return {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing contact form:', error);
      throw new Error('Failed to process contact form');
    }
  }

  /**
   * Get system statistics
   */
  public getSystemStats(): {
    uptime: string;
    memoryUsage: string;
    nodeVersion: string;
    platform: string;
  } {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return {
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      memoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      nodeVersion: process.version,
      platform: process.platform
    };
  }
} 