import { Search, Mail, MapPin, Phone, AtSign } from 'lucide-react';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

// @mock-start
// @mock-end

export interface InputLeadingIconProps {}

export function InputLeadingIcon(_props: InputLeadingIconProps = {}) {
  return (
    <div className="grid gap-6 px-8 py-10 sm:grid-cols-2">
      <Field>
        <FieldLabel>Search</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput type="search" placeholder="Search work orders…" />
        </InputGroup>
        <FieldDescription>
          Leading icon establishes intent before the user reads the placeholder.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Email address</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Mail />
          </InputGroupAddon>
          <InputGroupInput
            type="email"
            placeholder="jane@vertexlabs.com"
            defaultValue="jane@vertexlabs.com"
          />
        </InputGroup>
        <FieldDescription>
          Icon visually doubles as a type indicator.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Username</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <AtSign />
          </InputGroupAddon>
          <InputGroupInput placeholder="janedoe" />
        </InputGroup>
        <FieldDescription>
          The @ symbol works as both icon and prefix.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Phone</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Phone />
          </InputGroupAddon>
          <InputGroupInput
            type="tel"
            placeholder="(555) 010-2842"
          />
        </InputGroup>
        <FieldDescription>
          Stays compact — no separate country selector.
        </FieldDescription>
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel>Address</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <MapPin />
          </InputGroupAddon>
          <InputGroupInput placeholder="450 Mission St, San Francisco" />
        </InputGroup>
        <FieldDescription>
          Spans full row — leading icon scales without breaking alignment.
        </FieldDescription>
      </Field>
    </div>
  );
}
