<script setup lang="ts">
import {
  Calendar,
  ChevronRight,
  LogOut,
  Mail,
  Plus,
  Settings,
  Star,
  User,
} from '@lucide/vue'

const { openpencil } = useAppConfig()
const email = ref('')
const notifications = ref(true)
const toggleValue = ref(false)
const toggleGroupValue = ref(['bold'])
</script>

<template>
  <div class="mx-auto px-4 pb-20 max-w-7xl space-y-16">
    <!-- Header -->
    <header class="mb-12 py-8 border-b">
      <h1 class="text-4xl tracking-tight font-extrabold">
        Component Gallery
      </h1>
      <p class="text-lg text-muted-foreground mt-3">
        A comprehensive guide to all available components in the
        <span class="text-foreground font-mono font-semibold px-1.5 py-0.5 rounded bg-muted italic">{{ openpencil.ui.name }}</span> layer.
      </p>
    </header>

    <!-- 1. Buttons & Groups -->
    <section class="gap-12 grid grid-cols-1 items-start lg:grid-cols-2">
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold">
            Buttons
          </h2>
          <p class="text-muted-foreground mt-1">
            Different variants and sizes for various actions.
          </p>
        </div>
        <div class="flex flex-wrap gap-4 items-center">
          <UiButton>Primary</UiButton>
          <UiButton variant="secondary">
            Secondary
          </UiButton>
          <UiButton variant="outline">
            Outline
          </UiButton>
          <UiButton variant="ghost">
            Ghost
          </UiButton>
          <UiButton variant="destructive">
            Destructive
          </UiButton>
          <UiButton variant="link">
            Link
          </UiButton>
        </div>
        <div class="flex flex-wrap gap-4 items-center">
          <UiButton size="sm">
            Small
          </UiButton>
          <UiButton>Default</UiButton>
          <UiButton size="lg">
            Large
          </UiButton>
          <UiButton size="icon" variant="outline">
            <Star class="size-4" />
          </UiButton>
        </div>
        <div class="flex flex-wrap gap-4 items-center">
          <UiButton disabled>
            Disabled
          </UiButton>
          <UiButton variant="outline">
            <Mail class="mr-2 h-4 w-4" /> Login with Email
          </UiButton>
        </div>
      </div>

      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold">
            Button Groups
          </h2>
          <p class="text-muted-foreground mt-1">
            Combine multiple buttons into a single unit.
          </p>
        </div>
        <div class="flex flex-col gap-6">
          <UiButtonGroup>
            <UiButton variant="outline">
              Year
            </UiButton>
            <UiButton variant="outline">
              Month
            </UiButton>
            <UiButton variant="outline">
              Day
            </UiButton>
          </UiButtonGroup>

          <UiButtonGroup>
            <UiButton variant="secondary" size="icon">
              <Star class="size-4" />
            </UiButton>
            <UiButtonGroupSeparator />
            <UiButton variant="secondary">
              Star it
            </UiButton>
            <UiButtonGroupSeparator />
            <UiButtonGroupText>1.2k stars</UiButtonGroupText>
          </UiButtonGroup>
        </div>
      </div>
    </section>

    <!-- 2. Form Controls -->
    <section class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold">
          Form Controls
        </h2>
        <p class="text-muted-foreground mt-1">
          Inputs, labels, switches, and toggles.
        </p>
      </div>

      <div class="gap-12 grid grid-cols-1 md:grid-cols-3">
        <div class="space-y-6">
          <div class="space-y-2">
            <UiLabel for="email-example">
              Email Address
            </UiLabel>
            <UiInput
              id="email-example"
              v-model="email"
              type="email"
              placeholder="m@example.com"
            />
          </div>
          <div class="opacity-50 space-y-2">
            <UiLabel for="disabled-example">
              Disabled Field
            </UiLabel>
            <UiInput
              id="disabled-example"
              disabled
              placeholder="Read-only data"
            />
          </div>
        </div>

        <div class="p-4 border rounded-lg bg-card space-y-6">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <UiLabel>Push Notifications</UiLabel>
              <p class="text-[0.8rem] text-muted-foreground italic">
                Receive alerts on your device.
              </p>
            </div>
            <UiSwitch v-model:checked="notifications" />
          </div>
          <UiSeparator />
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <UiLabel>Color Theme</UiLabel>
              <p class="text-[0.8rem] text-muted-foreground italic">
                Switch between light, dark, and system.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div class="space-y-6">
          <div class="space-y-3">
            <UiLabel>Status Toggle</UiLabel>
            <div class="flex gap-2">
              <UiToggle
                v-model:pressed="toggleValue"
                aria-label="Toggle star"
                variant="outline"
              >
                <Star class="mr-2 h-4 w-4" /> {{ toggleValue ? 'Starred' : 'Star' }}
              </UiToggle>
            </div>
          </div>
          <div class="space-y-3">
            <UiLabel>Formatting Group</UiLabel>
            <UiToggleGroup
              v-model="toggleGroupValue"
              type="multiple"
              variant="outline"
            >
              <UiToggleGroupItem value="bold" aria-label="Toggle bold">
                <div class="i-carbon-text-bold h-4 w-4" />
              </UiToggleGroupItem>
              <UiToggleGroupItem value="italic" aria-label="Toggle italic">
                <div class="i-carbon-text-italic h-4 w-4" />
              </UiToggleGroupItem>
              <UiToggleGroupItem value="underline" aria-label="Toggle underline">
                <div class="i-carbon-text-underline h-4 w-4" />
              </UiToggleGroupItem>
            </UiToggleGroup>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Overlays & Feedback -->
    <section class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold">
          Overlays & Tooltips
        </h2>
        <p class="text-muted-foreground mt-1">
          Dialogs, sheets, hover cards, and tooltips.
        </p>
      </div>

      <div class="flex flex-wrap gap-6 items-center">
        <!-- Dialog -->
        <UiDialog>
          <UiDialogTrigger as-child>
            <UiButton variant="outline">
              Open Dialog
            </UiButton>
          </UiDialogTrigger>
          <UiDialogContent class="sm:max-w-[425px]">
            <UiDialogHeader>
              <UiDialogTitle>Edit profile</UiDialogTitle>
              <UiDialogDescription>
                Make changes to your profile here. Click save when you're done.
              </UiDialogDescription>
            </UiDialogHeader>
            <div class="py-4 gap-4 grid">
              <div class="gap-4 grid grid-cols-4 items-center">
                <UiLabel for="name" class="text-right italic">
                  Name
                </UiLabel>
                <UiInput
                  id="name"
                  value="Pedro Duarte"
                  class="col-span-3"
                />
              </div>
            </div>
            <UiDialogFooter>
              <UiButton type="submit">
                Save changes
              </UiButton>
            </UiDialogFooter>
          </UiDialogContent>
        </UiDialog>

        <!-- Sheet -->
        <UiSheet>
          <UiSheetTrigger as-child>
            <UiButton variant="outline">
              Open Sheet
            </UiButton>
          </UiSheetTrigger>
          <UiSheetContent>
            <UiSheetHeader>
              <UiSheetTitle>Sidebar Navigation</UiSheetTitle>
              <UiSheetDescription>
                Quick access to settings and user profile details.
              </UiSheetDescription>
            </UiSheetHeader>
            <div class="py-12 space-y-4">
              <UiButton variant="ghost" class="w-full justify-start">
                <User class="mr-2 h-4 w-4" /> Profile
              </UiButton>
              <UiButton variant="ghost" class="w-full justify-start">
                <Settings class="mr-2 h-4 w-4" /> Settings
              </UiButton>
            </div>
            <UiSheetFooter>
              <UiSheetClose as-child>
                <UiButton variant="secondary">
                  Close Sidebar
                </UiButton>
              </UiSheetClose>
            </UiSheetFooter>
          </UiSheetContent>
        </UiSheet>

        <!-- Dropdown Menu -->
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="outline">
              Menu Actions <ChevronRight class="ml-2 h-4 w-4 rotate-90" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent class="w-56">
            <UiDropdownMenuLabel>My Account</UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuGroup>
              <UiDropdownMenuItem>
                <User class="mr-2 h-4 w-4" />
                <span>Profile</span>
                <UiDropdownMenuShortcut>⇧⌘P</UiDropdownMenuShortcut>
              </UiDropdownMenuItem>
              <UiDropdownMenuItem>
                <Settings class="mr-2 h-4 w-4" />
                <span>Settings</span>
                <UiDropdownMenuShortcut>⌘S</UiDropdownMenuShortcut>
              </UiDropdownMenuItem>
            </UiDropdownMenuGroup>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem class="text-destructive">
              <LogOut class="mr-2 h-4 w-4" />
              <span>Log out</span>
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>

        <!-- Tooltip -->
        <UiTooltip>
          <UiTooltipTrigger as-child>
            <UiButton variant="outline" size="icon">
              <Plus class="h-4 w-4" />
            </UiButton>
          </UiTooltipTrigger>
          <UiTooltipContent>
            <p>Add new project</p>
          </UiTooltipContent>
        </UiTooltip>

        <!-- Hover Card -->
        <UiHoverCard>
          <UiHoverCardTrigger as-child>
            <UiButton variant="link">
              @nuxt_js
            </UiButton>
          </UiHoverCardTrigger>
          <UiHoverCardContent class="w-80">
            <div class="flex justify-between space-x-4">
              <div class="text-primary font-bold rounded-full bg-primary/20 flex size-10 italic items-center justify-center">
                N
              </div>
              <div class="space-y-1">
                <h4 class="text-sm font-semibold italic">
                  @nuxt_js
                </h4>
                <p class="text-sm">
                  The Intuitive Vue Framework. Build your next Vue.js application with confidence.
                </p>
                <div class="pt-2 flex italic items-center">
                  <Calendar class="mr-2 opacity-70 h-4 w-4" />
                  <span class="text-xs text-muted-foreground italic">Joined January 2016</span>
                </div>
              </div>
            </div>
          </UiHoverCardContent>
        </UiHoverCard>
      </div>
    </section>

    <!-- 4. Layout & Cards -->
    <section class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold">
          Data Display
        </h2>
        <p class="text-muted-foreground mt-1">
          Cards and separators.
        </p>
      </div>

      <div class="gap-8 grid grid-cols-1 md:grid-cols-2">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle>Feature Project</UiCardTitle>
            <UiCardDescription>Last updated 2 days ago</UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <p class="text-sm italic">
              A high-performance web application leveraging the latest Nuxt features for a seamless developer experience.
            </p>
          </UiCardContent>
          <UiCardFooter class="mt-2 p-4 border-t justify-between">
            <div class="flex -space-x-2">
              <div
                v-for="i in 3"
                :key="i"
                class="text-xs font-bold border-2 border-background rounded-full bg-muted flex size-8 items-center justify-center"
              >
                {{ i }}
              </div>
            </div>
            <UiButton size="sm" variant="ghost">
              View Details
            </UiButton>
          </UiCardFooter>
        </UiCard>

        <div class="space-y-8">
          <div class="space-y-4">
            <h3 class="text-sm text-muted-foreground leading-none tracking-wider font-medium font-semibold uppercase italic">
              Project Metadata
            </h3>
            <div class="text-sm font-semibold flex h-5 items-center space-x-4">
              <div>v1.0.4</div>
              <UiSeparator orientation="vertical" />
              <div>Production</div>
              <UiSeparator orientation="vertical" />
              <div>EU-West-1</div>
            </div>
          </div>

          <UiCard class="text-primary-foreground border-none bg-primary">
            <UiCardHeader>
              <UiCardTitle class="text-xl">
                Pro Plan Active
              </UiCardTitle>
            </UiCardHeader>
            <UiCardContent>
              <p class="text-sm font-medium opacity-90">
                Enjoy unlimited projects and priority support for your entire team.
              </p>
            </UiCardContent>
          </UiCard>
        </div>
      </div>
    </section>
  </div>
</template>
