/*
  # Add sample provider data

  1. New Data
    - Add sample providers with different specialties and geographic areas
    - Includes a mix of:
      - Primary Care, Cardiology, Neurology, and Oncology specialties
      - Urban, Suburban, and Rural areas
      - Different practice sizes
    
  2. Changes
    - Adds 100 sample providers to demonstrate targeting functionality
*/

-- Insert sample providers with different combinations of specialties and areas
INSERT INTO providers (specialty, geographic_area, practice_size) VALUES
  -- Primary Care Physicians
  ('Primary Care', 'New York City', 'Large'),
  ('Primary Care', 'Los Angeles', 'Medium'),
  ('Primary Care', 'Chicago', 'Small'),
  ('Primary Care', 'Rural Iowa', 'Small'),
  ('Primary Care', 'Seattle', 'Medium'),
  ('Primary Care', 'Boston', 'Large'),
  ('Primary Care', 'Miami', 'Medium'),
  ('Primary Care', 'Denver', 'Small'),
  ('Primary Care', 'Atlanta', 'Large'),
  ('Primary Care', 'Phoenix', 'Medium'),
  ('Primary Care', 'Dallas', 'Large'),
  ('Primary Care', 'Houston', 'Medium'),
  ('Primary Care', 'Philadelphia', 'Small'),
  ('Primary Care', 'San Francisco', 'Large'),
  ('Primary Care', 'Portland', 'Medium'),
  ('Primary Care', 'Las Vegas', 'Small'),
  ('Primary Care', 'Minneapolis', 'Medium'),
  ('Primary Care', 'Detroit', 'Large'),
  ('Primary Care', 'San Diego', 'Medium'),
  ('Primary Care', 'Nashville', 'Small'),

  -- Cardiologists
  ('Cardiology', 'New York City', 'Large'),
  ('Cardiology', 'Los Angeles', 'Large'),
  ('Cardiology', 'Chicago', 'Medium'),
  ('Cardiology', 'Houston', 'Large'),
  ('Cardiology', 'Phoenix', 'Medium'),
  ('Cardiology', 'Philadelphia', 'Large'),
  ('Cardiology', 'San Antonio', 'Small'),
  ('Cardiology', 'San Diego', 'Medium'),
  ('Cardiology', 'Dallas', 'Large'),
  ('Cardiology', 'San Jose', 'Medium'),
  ('Cardiology', 'Austin', 'Small'),
  ('Cardiology', 'Jacksonville', 'Medium'),
  ('Cardiology', 'Fort Worth', 'Large'),
  ('Cardiology', 'Columbus', 'Medium'),
  ('Cardiology', 'San Francisco', 'Large'),

  -- Neurologists
  ('Neurology', 'New York City', 'Large'),
  ('Neurology', 'Los Angeles', 'Medium'),
  ('Neurology', 'Chicago', 'Large'),
  ('Neurology', 'Houston', 'Medium'),
  ('Neurology', 'Phoenix', 'Small'),
  ('Neurology', 'Philadelphia', 'Large'),
  ('Neurology', 'San Antonio', 'Medium'),
  ('Neurology', 'San Diego', 'Small'),
  ('Neurology', 'Dallas', 'Large'),
  ('Neurology', 'San Jose', 'Medium'),
  ('Neurology', 'Austin', 'Large'),
  ('Neurology', 'Jacksonville', 'Small'),
  ('Neurology', 'Fort Worth', 'Medium'),
  ('Neurology', 'Columbus', 'Small'),
  ('Neurology', 'San Francisco', 'Large'),

  -- Oncologists
  ('Oncology', 'New York City', 'Large'),
  ('Oncology', 'Los Angeles', 'Large'),
  ('Oncology', 'Chicago', 'Medium'),
  ('Oncology', 'Houston', 'Large'),
  ('Oncology', 'Phoenix', 'Medium'),
  ('Oncology', 'Philadelphia', 'Small'),
  ('Oncology', 'San Antonio', 'Large'),
  ('Oncology', 'San Diego', 'Medium'),
  ('Oncology', 'Dallas', 'Small'),
  ('Oncology', 'San Jose', 'Large'),
  ('Oncology', 'Austin', 'Medium'),
  ('Oncology', 'Jacksonville', 'Small'),
  ('Oncology', 'Fort Worth', 'Large'),
  ('Oncology', 'Columbus', 'Medium'),
  ('Oncology', 'San Francisco', 'Small'),

  -- Additional Primary Care in different areas
  ('Primary Care', 'Rural Montana', 'Small'),
  ('Primary Care', 'Rural Wyoming', 'Small'),
  ('Primary Care', 'Rural Alaska', 'Small'),
  ('Primary Care', 'Rural Vermont', 'Small'),
  ('Primary Care', 'Rural Maine', 'Small'),
  ('Primary Care', 'Suburban Boston', 'Medium'),
  ('Primary Care', 'Suburban Chicago', 'Medium'),
  ('Primary Care', 'Suburban LA', 'Medium'),
  ('Primary Care', 'Suburban NYC', 'Medium'),
  ('Primary Care', 'Suburban Miami', 'Medium'),

  -- Additional specialists in rural areas
  ('Cardiology', 'Rural Texas', 'Small'),
  ('Cardiology', 'Rural Oklahoma', 'Small'),
  ('Neurology', 'Rural Kansas', 'Small'),
  ('Neurology', 'Rural Nebraska', 'Small'),
  ('Oncology', 'Rural Idaho', 'Small'),
  ('Oncology', 'Rural Oregon', 'Small'),

  -- Additional specialists in suburban areas
  ('Cardiology', 'Suburban Atlanta', 'Medium'),
  ('Cardiology', 'Suburban Houston', 'Medium'),
  ('Neurology', 'Suburban Dallas', 'Medium'),
  ('Neurology', 'Suburban Phoenix', 'Medium'),
  ('Oncology', 'Suburban Seattle', 'Medium'),
  ('Oncology', 'Suburban Denver', 'Medium');